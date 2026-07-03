"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publisherRedis = exports.redis = void 0;
exports.createBullMQRedisClient = createBullMQRedisClient;
exports.closeRedisConnections = closeRedisConnections;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("./logger");
// ─── Reconnect Strategy ───────────────────────────────────────────────────────
/**
 * Exponential back-off with a cap of 30 s.
 * Returns `null` after 20 consecutive failures to surface the error
 * instead of silently retrying forever.
 */
function reconnectStrategy(times) {
    if (times > 20) {
        logger_1.logger.error('Redis reconnect limit reached. Giving up.', { attempts: times });
        return null; // stop retrying
    }
    const delay = Math.min(100 * Math.pow(2, times), 30_000);
    logger_1.logger.warn('Redis reconnecting…', { attempt: times, delayMs: delay });
    return delay;
}
// ─── Shared Options ───────────────────────────────────────────────────────────
const REDIS_OPTIONS = {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: true,
    retryStrategy: reconnectStrategy,
    lazyConnect: false,
    showFriendlyErrorStack: env_1.env.NODE_ENV !== 'production',
    connectTimeout: 10_000,
    commandTimeout: 5_000,
};
// ─── Singleton Factory ────────────────────────────────────────────────────────
function createRedisClient(label, options = {}) {
    const client = new ioredis_1.default(env_1.env.REDIS_URL, { ...REDIS_OPTIONS, ...options });
    client.on('connect', () => logger_1.logger.info(`Redis [${label}] connecting…`));
    client.on('ready', () => logger_1.logger.info(`Redis [${label}] ready`));
    client.on('error', (err) => logger_1.logger.error(`Redis [${label}] error`, { error: err }));
    client.on('close', () => logger_1.logger.warn(`Redis [${label}] connection closed`));
    client.on('reconnecting', (delay) => logger_1.logger.warn(`Redis [${label}] reconnecting in ${delay}ms`));
    client.on('end', () => logger_1.logger.warn(`Redis [${label}] connection ended permanently`));
    return client;
}
// ─── Exports ──────────────────────────────────────────────────────────────────
/**
 * Primary IORedis client for general commands (HSET, EXPIRE, LPUSH, …).
 * Shared across HeartbeatService, LeaseManagerService, and the job processor.
 */
exports.redis = createRedisClient('main');
/**
 * Dedicated IORedis client used exclusively for PUBLISH commands.
 * Kept separate from the main client to prevent any mode conflicts.
 */
exports.publisherRedis = createRedisClient('publisher');
/**
 * Factory that creates a fresh Redis client suitable for use as a BullMQ
 * connection. BullMQ requires `maxRetriesPerRequest: null`.
 *
 * @returns A new Redis instance pre-configured for BullMQ.
 */
function createBullMQRedisClient() {
    return createRedisClient('bullmq', { maxRetriesPerRequest: null });
}
/**
 * Gracefully closes all shared Redis connections.
 * Call this during graceful shutdown before `process.exit`.
 */
async function closeRedisConnections() {
    logger_1.logger.info('Closing Redis connections…');
    await Promise.allSettled([exports.redis.quit(), exports.publisherRedis.quit()]);
    logger_1.logger.info('Redis connections closed');
}
//# sourceMappingURL=redis.js.map