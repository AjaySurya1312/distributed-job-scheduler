/**
 * @file lease-manager.service.ts
 * @description Stale worker detection and orphaned job recovery.
 *
 * The LeaseManagerService runs on a configurable interval and scans PostgreSQL
 * for Worker rows that haven't sent a heartbeat within the stale threshold.
 *
 * Recovery flow for each stale worker:
 *  1. Mark the Worker row as DEAD so no other service attempts to interact with it.
 *  2. Find all Job rows that were RUNNING under that worker.
 *  3. Reset each orphaned job to QUEUED and push it back onto its Redis queue
 *     so a healthy worker can pick it up.
 *  4. Publish a WORKER_DEAD event to the 'worker-events' channel for real-time
 *     dashboards and alerting.
 *
 * Housekeeping (runs on every scan tick):
 *  - Delete WorkerHeartbeat rows older than 7 days to prevent unbounded growth.
 *  - Delete expired RefreshToken rows.
 *
 * Only one instance of LeaseManagerService should run across the entire fleet
 * (controlled by the ENABLE_LEASE_MANAGER env flag).
 */

import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../config/logger';
import { env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Signature of the publish function passed in from index.ts */
type PublishFn = (channel: string, message: string) => Promise<void>;

/** Shape of the WORKER_DEAD event payload */
interface WorkerDeadEvent {
  type: 'WORKER_DEAD';
  workerId: string;
  workerHostname: string;
  orphanedJobCount: number;
  timestamp: string;
}

// ─── LeaseManagerService ──────────────────────────────────────────────────────

/**
 * Scans for stale workers and recovers their orphaned jobs.
 *
 * @example
 * const lm = new LeaseManagerService(redis, prisma, publish);
 * lm.start();
 * // …
 * lm.stop();
 */
export class LeaseManagerService {
  private readonly log;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private scanning = false; // prevent overlapping scans

  /**
   * @param redis     - Shared IORedis client for LPUSH (re-queue orphaned jobs)
   * @param prisma    - Shared Prisma client
   * @param publish   - Function to publish events to a Redis channel
   */
  constructor(
    private readonly redis: Redis,
    private readonly prisma: PrismaClient,
    private readonly publish: PublishFn,
  ) {
    this.log = createChildLogger({ service: 'LeaseManagerService' });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Starts the lease-manager scan interval.
   * Safe to call multiple times; subsequent calls are no-ops.
   */
  start(): void {
    if (this.intervalHandle !== null) {
      this.log.warn('LeaseManagerService already started — ignoring duplicate start()');
      return;
    }

    this.log.info('Starting LeaseManagerService', {
      intervalMs: env.LEASE_CHECK_INTERVAL_MS,
      staleThresholdMs: env.WORKER_STALE_THRESHOLD_MS,
    });

    // First scan runs after one full interval to let other workers start up
    this.intervalHandle = setInterval(() => {
      void this.scan();
    }, env.LEASE_CHECK_INTERVAL_MS);

    if (this.intervalHandle.unref) {
      this.intervalHandle.unref();
    }
  }

  /**
   * Stops the scan interval. Does not wait for an in-progress scan to finish.
   */
  stop(): void {
    this.log.info('Stopping LeaseManagerService');

    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  /**
   * Main scan routine. Finds stale workers, recovers their jobs, and runs
   * housekeeping queries. Protected by a `scanning` flag so concurrent
   * invocations are dropped rather than stacked.
   */
  private async scan(): Promise<void> {
    if (this.scanning) {
      this.log.debug('Previous scan still running — skipping this tick');
      return;
    }

    this.scanning = true;
    this.log.debug('Lease scan started');

    try {
      await this.recoverStaleWorkers();
      await this.runHousekeeping();
    } catch (err) {
      this.log.error('Unexpected error during lease scan', { error: err });
    } finally {
      this.scanning = false;
      this.log.debug('Lease scan finished');
    }
  }

  /**
   * Identifies workers that have missed their heartbeat and recovers any jobs
   * they were processing at the time of death.
   */
  private async recoverStaleWorkers(): Promise<void> {
    const staleThreshold = new Date(Date.now() - env.WORKER_STALE_THRESHOLD_MS);

    // Find workers that are registered as ACTIVE but haven't heartbeated recently
    const staleWorkers = await this.prisma.worker.findMany({
      where: {
        status: 'ACTIVE',
        lastHeartbeatAt: { lt: staleThreshold },
      },
      select: {
        id: true,
        hostname: true,
        pid: true,
        lastHeartbeatAt: true,
      },
    });

    if (staleWorkers.length === 0) {
      this.log.debug('No stale workers found');
      return;
    }

    this.log.warn(`Found ${staleWorkers.length} stale worker(s)`, {
      staleThreshold: staleThreshold.toISOString(),
      workerIds: staleWorkers.map((w) => w.id),
    });

    for (const staleWorker of staleWorkers) {
      await this.recoverWorker(staleWorker);
    }
  }

  /**
   * Marks a single stale worker as DEAD and re-queues all jobs it was running.
   */
  private async recoverWorker(staleWorker: {
    id: string;
    hostname: string | null;
    pid: number | null;
    lastHeartbeatAt: Date | null;
  }): Promise<void> {
    const workerLog = createChildLogger({
      service: 'LeaseManagerService',
      targetWorkerId: staleWorker.id,
    });

    workerLog.warn('Marking worker as DEAD', {
      hostname: staleWorker.hostname,
      pid: staleWorker.pid,
      lastHeartbeatAt: staleWorker.lastHeartbeatAt?.toISOString(),
    });

    // ── Step 1: Mark worker DEAD ───────────────────────────────────────────
    try {
      await this.prisma.worker.update({
        where: { id: staleWorker.id },
        data: { status: 'DEAD', diedAt: new Date() },
      });
    } catch (err) {
      workerLog.error('Failed to mark worker as DEAD', { error: err });
      // Continue — attempt to recover orphaned jobs anyway
    }

    // ── Step 2: Find all RUNNING jobs owned by the stale worker ────────────
    let orphanedJobs: Array<{
      id: string;
      queueName: string;
      payload: unknown;
      priority: number | null;
    }>;

    try {
      orphanedJobs = await this.prisma.job.findMany({
        where: {
          workerId: staleWorker.id,
          status: 'RUNNING',
        },
        select: {
          id: true,
          queueName: true,
          payload: true,
          priority: true,
        },
      });
    } catch (err) {
      workerLog.error('Failed to query orphaned jobs', { error: err });
      return;
    }

    workerLog.info(`Found ${orphanedJobs.length} orphaned job(s) to recover`, {
      jobIds: orphanedJobs.map((j) => j.id),
    });

    // ── Step 3: Reset each orphaned job and push back to its queue ──────────
    let recoveredCount = 0;

    for (const job of orphanedJobs) {
      try {
        // Reset job in PostgreSQL
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'QUEUED',
            workerId: null,
            startedAt: null,
            lastError: `Recovered from dead worker ${staleWorker.id}`,
            retriesUsed: { increment: 1 },
          },
        });

        // Create an execution log entry for the crash
        await this.prisma.execution.create({
          data: {
            jobId: job.id,
            workerId: staleWorker.id,
            status: 'CRASHED',
            startedAt: new Date(),
            finishedAt: new Date(),
            durationMs: 0,
            errorMessage: `Worker ${staleWorker.id} died without completing the job`,
          },
        });

        // Re-push to Redis queue so BullMQ can pick it up
        // We push the full payload so the queue consumer sees the same data
        const queueKey = `bull:${job.queueName}:wait`;
        const jobData = JSON.stringify({
          jobId: job.id,
          ...(job.payload as Record<string, unknown>),
        });

        await this.redis.lpush(queueKey, jobData);

        recoveredCount++;

        workerLog.info('Orphaned job recovered and re-queued', {
          jobId: job.id,
          queueName: job.queueName,
        });
      } catch (err) {
        workerLog.error('Failed to recover orphaned job', {
          jobId: job.id,
          error: err,
        });
      }
    }

    // ── Step 4: Publish WORKER_DEAD event ──────────────────────────────────
    const event: WorkerDeadEvent = {
      type: 'WORKER_DEAD',
      workerId: staleWorker.id,
      workerHostname: staleWorker.hostname ?? 'unknown',
      orphanedJobCount: recoveredCount,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.publish('worker-events', JSON.stringify(event));
      workerLog.info('WORKER_DEAD event published', { recoveredCount });
    } catch (err) {
      workerLog.warn('Failed to publish WORKER_DEAD event', { error: err });
    }
  }

  /**
   * Runs periodic housekeeping to keep the database lean:
   *  - Delete WorkerHeartbeat records older than 7 days
   *  - Delete expired RefreshToken records
   */
  private async runHousekeeping(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000);

    // ── Purge old heartbeat records ────────────────────────────────────────
    try {
      const { count: heartbeatCount } = await this.prisma.workerHeartbeat.deleteMany({
        where: { recordedAt: { lt: sevenDaysAgo } },
      });

      if (heartbeatCount > 0) {
        this.log.info('Purged old WorkerHeartbeat records', { count: heartbeatCount });
      }
    } catch (err) {
      this.log.error('Failed to purge old WorkerHeartbeat records', { error: err });
    }

    // ── Purge expired refresh tokens ───────────────────────────────────────
    try {
      const { count: tokenCount } = await this.prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      if (tokenCount > 0) {
        this.log.info('Purged expired RefreshToken records', { count: tokenCount });
      }
    } catch (err) {
      this.log.error('Failed to purge expired RefreshToken records', { error: err });
    }
  }
}
