/**
 * @file src/config/redis.ts
 * @description IORedis client singleton for BullMQ, caching, and pub/sub.
 * Exports separate connection instances for BullMQ (blocking) and general use.
 */
import Redis from 'ioredis';
/**
 * General-purpose Redis client for caching, token blacklisting, session management.
 */
export declare const redisClient: Redis;
/**
 * Dedicated connection for BullMQ workers (requires maxRetriesPerRequest: null).
 * BullMQ requires a separate connection per queue to avoid blocking.
 */
export declare const bullmqConnection: Redis;
/**
 * Pub/Sub subscriber connection. Cannot be used for regular commands.
 */
export declare const redisSubscriber: Redis;
/**
 * Pub/Sub publisher connection.
 */
export declare const redisPublisher: Redis;
/**
 * Pings the Redis server and returns true if healthy.
 */
export declare function checkRedisHealth(): Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map