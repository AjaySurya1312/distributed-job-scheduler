/**
 * @file heartbeat.service.ts
 * @description Worker liveness tracking via Redis and PostgreSQL.
 *
 * The HeartbeatService runs on a fixed interval and does two things:
 *
 *  1. **Redis** — HSET `workers:{workerId}` with current metadata and apply a
 *     30-second TTL. If the worker process dies the TTL naturally expires,
 *     which the LeaseManagerService uses to detect stale workers.
 *
 *  2. **PostgreSQL** — INSERT a `WorkerHeartbeat` row with resource metrics so
 *     the API can expose historical worker health dashboards.
 *
 * Resource metrics (CPU %, heap MB) are collected using Node.js built-ins so
 * there are no additional native-module dependencies.
 */
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';
/**
 * Maintains worker liveness signals in Redis and PostgreSQL.
 *
 * @example
 * const hb = new HeartbeatService(workerId, 'email', redis, prisma);
 * hb.start();
 * // … later …
 * await hb.stop();
 */
export declare class HeartbeatService {
    private readonly workerId;
    private readonly queueName;
    private readonly redis;
    private readonly prisma;
    private readonly log;
    private readonly cpuSampler;
    private readonly redisKey;
    private intervalHandle;
    private activeJobs;
    /**
     * @param workerId  - UUID that uniquely identifies this worker instance
     * @param queueName - Human-readable queue name for logging context
     * @param redis     - Shared IORedis client
     * @param prisma    - Shared Prisma client
     */
    constructor(workerId: string, queueName: string, redis: Redis, prisma: PrismaClient);
    /**
     * Begins the heartbeat interval. Fires immediately then every
     * `HEARTBEAT_INTERVAL_MS` milliseconds. Safe to call multiple times
     * (subsequent calls are no-ops if already started).
     */
    start(): void;
    /**
     * Stops the heartbeat interval and marks the worker as STOPPED in both
     * Redis and PostgreSQL.
     */
    stop(): Promise<void>;
    /**
     * Updates the count of jobs currently being processed by this worker.
     * The new count is included in the very next heartbeat beat.
     *
     * @param count - Current active job count
     */
    updateActiveJobs(count: number): void;
    /**
     * Performs one heartbeat cycle:
     *  - Writes liveness data to Redis with a 30-second TTL
     *  - Inserts a `WorkerHeartbeat` row in PostgreSQL with resource metrics
     *
     * Errors are caught and logged but never propagated — a failed heartbeat
     * should never kill the worker.
     */
    private beat;
}
//# sourceMappingURL=heartbeat.service.d.ts.map