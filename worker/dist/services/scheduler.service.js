"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const cron_parser_1 = __importDefault(require("cron-parser"));
const uuid_1 = require("uuid");
const logger_1 = require("../config/logger");
// ─── Constants ────────────────────────────────────────────────────────────────
/** Default priority for scheduler-enqueued jobs. */
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
class SchedulerService {
    redis;
    prisma;
    log;
    intervalHandle = null;
    ticking = false; // prevent overlapping ticks
    /**
     * @param redis  - Shared IORedis client for LPUSH
     * @param prisma - Shared Prisma client
     */
    constructor(redis, prisma) {
        this.redis = redis;
        this.prisma = prisma;
        this.log = (0, logger_1.createChildLogger)({ service: 'SchedulerService' });
    }
    // ─── Public API ─────────────────────────────────────────────────────────────
    /**
     * Starts the scheduler poll loop. Fires immediately then every 60 seconds.
     * Safe to call multiple times — subsequent calls are no-ops.
     */
    start() {
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
    stop() {
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
    async tick() {
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
            });
            if (dueSchedules.length === 0) {
                this.log.debug('No due scheduled jobs');
                return;
            }
            this.log.info(`Found ${dueSchedules.length} due scheduled job(s)`, {
                scheduleIds: dueSchedules.map((s) => s.id),
            });
            const queueIds = [...new Set(dueSchedules.map((s) => s.queueId))];
            const queues = await this.prisma.queue.findMany({
                where: { id: { in: queueIds } },
                select: { id: true, slug: true },
            });
            const queueMap = new Map(queues.map((q) => [q.id, q.slug]));
            const schedulesWithQueue = dueSchedules.map((schedule) => ({
                ...schedule,
                queue: { slug: queueMap.get(schedule.queueId) ?? 'default' },
            }));
            // Enqueue each due schedule
            await Promise.allSettled(schedulesWithQueue.map((schedule) => this.enqueueSchedule(schedule, now)));
        }
        catch (err) {
            this.log.error('Unexpected error during scheduler tick', { error: err });
        }
        finally {
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
    async enqueueSchedule(schedule, now) {
        const scheduleLog = (0, logger_1.createChildLogger)({
            service: 'SchedulerService',
            scheduledJobId: schedule.id,
            scheduleName: schedule.name,
        });
        // ── Calculate next run time ────────────────────────────────────────────
        let nextRunAt;
        try {
            const interval = cron_parser_1.default.parseExpression(schedule.cronExpression, {
                currentDate: now,
                tz: schedule.timezone ?? 'UTC',
            });
            nextRunAt = interval.next().toDate();
        }
        catch (err) {
            scheduleLog.error('Invalid cron expression — skipping schedule', {
                cronExpression: schedule.cronExpression,
                error: err,
            });
            return;
        }
        const jobId = (0, uuid_1.v4)();
        const queueName = schedule.queue.slug;
        const inputPayload = schedule.jobPayload ?? {};
        // ── Atomic transaction ─────────────────────────────────────────────────
        try {
            await this.prisma.$transaction(async (tx) => {
                // 1. Create Job record
                await tx.job.create({
                    data: {
                        id: jobId,
                        status: 'QUEUED',
                        type: 'SCHEDULED',
                        name: schedule.jobName,
                        queueId: schedule.queueId,
                        payload: {
                            jobId,
                            type: schedule.jobName,
                            input: inputPayload,
                            scheduledJobId: schedule.id,
                        },
                        priority: schedule.priority,
                        maxAttempts: 3,
                        jobTimeoutMs: 30_000,
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
                type: schedule.jobName,
                input: inputPayload,
                scheduledJobId: schedule.id,
            });
            await this.redis.lpush(queueKey, bullPayload);
            scheduleLog.info('Scheduled job enqueued', {
                jobId,
                queueName,
                nextRunAt: nextRunAt.toISOString(),
            });
        }
        catch (err) {
            scheduleLog.error('Failed to enqueue scheduled job', {
                jobId,
                queueName,
                error: err,
            });
        }
    }
}
exports.SchedulerService = SchedulerService;
//# sourceMappingURL=scheduler.service.js.map