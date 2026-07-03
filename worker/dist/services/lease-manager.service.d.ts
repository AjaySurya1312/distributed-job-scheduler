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
/** Signature of the publish function passed in from index.ts */
type PublishFn = (channel: string, message: string) => Promise<void>;
/**
 * Scans for stale workers and recovers their orphaned jobs.
 *
 * @example
 * const lm = new LeaseManagerService(redis, prisma, publish);
 * lm.start();
 * // …
 * lm.stop();
 */
export declare class LeaseManagerService {
    private readonly redis;
    private readonly prisma;
    private readonly publish;
    private readonly log;
    private intervalHandle;
    private scanning;
    /**
     * @param redis     - Shared IORedis client for LPUSH (re-queue orphaned jobs)
     * @param prisma    - Shared Prisma client
     * @param publish   - Function to publish events to a Redis channel
     */
    constructor(redis: Redis, prisma: PrismaClient, publish: PublishFn);
    /**
     * Starts the lease-manager scan interval.
     * Safe to call multiple times; subsequent calls are no-ops.
     */
    start(): void;
    /**
     * Stops the scan interval. Does not wait for an in-progress scan to finish.
     */
    stop(): void;
    /**
     * Main scan routine. Finds stale workers, recovers their jobs, and runs
     * housekeeping queries. Protected by a `scanning` flag so concurrent
     * invocations are dropped rather than stacked.
     */
    private scan;
    /**
     * Identifies workers that have missed their heartbeat and recovers any jobs
     * they were processing at the time of death.
     */
    private recoverStaleWorkers;
    /**
     * Marks a single stale worker as DEAD and re-queues all jobs it was running.
     */
    private recoverWorker;
    /**
     * Runs periodic housekeeping to keep the database lean:
     *  - Delete WorkerHeartbeat records older than 7 days
     *  - Delete expired RefreshToken records
     */
    private runHousekeeping;
}
export {};
//# sourceMappingURL=lease-manager.service.d.ts.map