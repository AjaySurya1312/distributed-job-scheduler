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
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';
/**
 * Polls the `ScheduledJob` table and enqueues due cron jobs.
 *
 * @example
 * const scheduler = new SchedulerService(redis, prisma);
 * scheduler.start();
 * // …
 * scheduler.stop();
 */
export declare class SchedulerService {
    private readonly redis;
    private readonly prisma;
    private readonly log;
    private intervalHandle;
    private ticking;
    /**
     * @param redis  - Shared IORedis client for LPUSH
     * @param prisma - Shared Prisma client
     */
    constructor(redis: Redis, prisma: PrismaClient);
    /**
     * Starts the scheduler poll loop. Fires immediately then every 60 seconds.
     * Safe to call multiple times — subsequent calls are no-ops.
     */
    start(): void;
    /**
     * Stops the scheduler poll loop. Safe to call without a corresponding start().
     */
    stop(): void;
    /**
     * Polls for due scheduled jobs and enqueues them.
     * Protected by the `ticking` flag so overlapping ticks are dropped.
     */
    private tick;
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
    private enqueueSchedule;
}
//# sourceMappingURL=scheduler.service.d.ts.map