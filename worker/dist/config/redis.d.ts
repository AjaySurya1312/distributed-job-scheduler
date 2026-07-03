/**
 * @file redis.ts
 * @description IORedis singleton with connection lifecycle management.
 *
 * A single IORedis client is shared across the entire worker process to avoid
 * exhausting file descriptors. The client is configured with an exponential
 * back-off reconnect strategy, comprehensive error handlers, and connection
 * event logging so operators can diagnose outages quickly.
 *
 * A separate `getSubscriberClient()` helper returns a dedicated subscriber
 * connection (IORedis mandates separate clients for Pub/Sub).
 */
import Redis from 'ioredis';
/**
 * Primary IORedis client for general commands (HSET, EXPIRE, LPUSH, …).
 * Shared across HeartbeatService, LeaseManagerService, and the job processor.
 */
export declare const redis: Redis;
/**
 * Dedicated IORedis client used exclusively for PUBLISH commands.
 * Kept separate from the main client to prevent any mode conflicts.
 */
export declare const publisherRedis: Redis;
/**
 * Factory that creates a fresh Redis client suitable for use as a BullMQ
 * connection. BullMQ requires `maxRetriesPerRequest: null`.
 *
 * @returns A new Redis instance pre-configured for BullMQ.
 */
export declare function createBullMQRedisClient(): Redis;
/**
 * Gracefully closes all shared Redis connections.
 * Call this during graceful shutdown before `process.exit`.
 */
export declare function closeRedisConnections(): Promise<void>;
//# sourceMappingURL=redis.d.ts.map