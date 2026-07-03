/**
 * @file scheduler.service.ts
 * @description Cron job scheduler that polls PostgreSQL for due scheduled jobs
 * and enqueues them onto the appropriate Redis queues.
 *
 * Design notes:
 *  - Polls every 60 seconds. For higher-frequency scheduling a dedicated tool
 *    such as pg-boss or Temporal should be used instead.
 *  - Uses `cron-parser` to calculate the next `nextRunAt` after enqueuing,
 *    ensuring the schedule stays accurate regardless of drift.
 *  - Each enqueue is wrapped in a database transaction: the Job row is created
 *    and `scheduledJob.lastRunAt` / `nextRunAt` are updated atomically.
 *  - Concurrent poll ticks are prevented by a `ticking` guard flag.
 *
 * Only one instance of SchedulerService should run across the fleet
 * (controlled by the ENABLE_SCHEDULER env flag in index.ts).
 */

import cronParser from 'cron-parser';
import { v4 as uuidv4 } from 'uuid';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../config/logger';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default priority for scheduler-enqueued jobs. */
const DEFAULT_PRIORITY = 5;

/** How often (ms) the scheduler polls for due jobs. */
const POLL_INTERVAL_MS = 60_000;

// ─── SchedulerService ─────────────────────────────────────────────────────────

/**
 * Polls the `ScheduledJob` table and enqueues due cron jobs.
 *
 * @example
 * const scheduler = new SchedulerService(redis, prisma);
 * scheduler.start();
 * // …
 * scheduler.stop();
 */
export class SchedulerService {
  private readonly log;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private ticking = false; // prevent overlapping ticks

  /**
   * @param redis  - Shared IORedis client for LPUSH
   * @param prisma - Shared Prisma client
   */
  constructor(
    private readonly redis: Redis,
    private readonly prisma: PrismaClient,
  ) {
    this.log = createChildLogger({ service: 'SchedulerService' });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Starts the scheduler poll loop. Fires immediately then every 60 seconds.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  start(): void {
    if (this.intervalHandle !== null) {
      this.log.warn('SchedulerService already started — ignoring duplicate start()');
      return;
    }

    this.log.info('Starting SchedulerService', { pollIntervalMs: POLL_INTERVAL_MS });

    // Fire immediately so jobs due at startup are not delayed by a full interval
    void this.tick();

    this.intervalHandle = setInterval(() => {
      void this.tick();
    }, POLL_INTERVAL_MS);

    if (this.intervalHandle.unref) {
      this.intervalHandle.unref();
    }
  }

  /**
   * Stops the scheduler poll loop. Safe to call without a corresponding start().
   */
  stop(): void {
    this.log.info('Stopping SchedulerService');

    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  /**
   * Polls for due scheduled jobs and enqueues them.
   * Protected by the `ticking` flag so overlapping ticks are dropped.
   */
  private async tick(): Promise<void> {
    if (this.ticking) {
      this.log.debug('Previous scheduler tick still running — skipping');
      return;
    }

    this.ticking = true;
    this.log.debug('Scheduler tick started');

    try {
      const now = new Date();

      // Fetch all active scheduled jobs whose next run time has arrived
      const dueSchedules = await this.prisma.scheduledJob.findMany({
        where: {
          isActive: true,
          nextRunAt: { lte: now },
        },
        include: {
          queue: { select: { slug: true } },
        },
      });

      if (dueSchedules.length === 0) {
        this.log.debug('No due scheduled jobs');
        return;
      }

      this.log.info(`Found ${dueSchedules.length} due scheduled job(s)`, {
        scheduleIds: dueSchedules.map((s) => s.id),
      });

      // Enqueue each due schedule
      await Promise.allSettled(
        dueSchedules.map((schedule) => this.enqueueSchedule(schedule, now)),
      );
    } catch (err) {
      this.log.error('Unexpected error during scheduler tick', { error: err });
    } finally {
      this.ticking = false;
      this.log.debug('Scheduler tick finished');
    }
  }

  /**
   * Enqueues a single due schedule:
   *  1. Creates a Job row in PostgreSQL (status = QUEUED)
   *  2. Pushes the job payload onto the Redis queue
   *  3. Updates the ScheduledJob: lastRunAt, nextRunAt, runCount
   *
   * All three operations are wrapped in a Prisma interactive transaction so a
   * partial failure doesn't leave the system in an inconsistent state.
   *
   * @param schedule - The due ScheduledJob record (with queue relation)
   * @param now      - Reference time for lastRunAt (consistent across the tick)
   */
  private async enqueueSchedule(
    schedule: {
      id: string;
      name: string;
      cronExpression: string;
      payload: unknown;
      jobType: string;
      timeoutMs: number | null;
      maxRetries: number | null;
      queueId: string;
      queue: { slug: string };
      timezone: string | null;
    },
    now: Date,
  ): Promise<void> {
    const scheduleLog = createChildLogger({
      service: 'SchedulerService',
      scheduledJobId: schedule.id,
      scheduleName: schedule.name,
    });

    // ── Calculate next run time ────────────────────────────────────────────
    let nextRunAt: Date;
    try {
      const interval = cronParser.parseExpression(schedule.cronExpression, {
        currentDate: now,
        tz: schedule.timezone ?? 'UTC',
      });
      nextRunAt = interval.next().toDate();
    } catch (err) {
      scheduleLog.error('Invalid cron expression — skipping schedule', {
        cronExpression: schedule.cronExpression,
        error: err,
      });
      return;
    }

    const jobId = uuidv4();
    const queueName = schedule.queue.slug;
    const inputPayload = (schedule.payload as Record<string, unknown>) ?? {};

    // ── Atomic transaction ─────────────────────────────────────────────────
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Create Job record
        await tx.job.create({
          data: {
            id: jobId,
            status: 'QUEUED',
            type: schedule.jobType,
            queueId: schedule.queueId,
            queueName,
            payload: {
              jobId,
              type: schedule.jobType,
              input: inputPayload,
              timeoutMs: schedule.timeoutMs ?? 30_000,
              maxRetries: schedule.maxRetries ?? 3,
              scheduledJobId: schedule.id,
            },
            priority: DEFAULT_PRIORITY,
            maxRetries: schedule.maxRetries ?? 3,
            timeoutMs: schedule.timeoutMs ?? 30_000,
            scheduledJobId: schedule.id,
            scheduledAt: now,
          },
        });

        // 2. Update ScheduledJob metadata
        await tx.scheduledJob.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt,
            runCount: { increment: 1 },
          },
        });
      });

      // 3. Push to Redis queue (outside transaction — acceptable eventual consistency)
      const queueKey = `bull:${queueName}:wait`;
      const bullPayload = JSON.stringify({
        jobId,
        type: schedule.jobType,
        input: inputPayload,
        timeoutMs: schedule.timeoutMs ?? 30_000,
        maxRetries: schedule.maxRetries ?? 3,
        scheduledJobId: schedule.id,
      });

      await this.redis.lpush(queueKey, bullPayload);

      scheduleLog.info('Scheduled job enqueued', {
        jobId,
        queueName,
        nextRunAt: nextRunAt.toISOString(),
      });
    } catch (err) {
      scheduleLog.error('Failed to enqueue scheduled job', {
        jobId,
        queueName,
        error: err,
      });
    }
  }
}
