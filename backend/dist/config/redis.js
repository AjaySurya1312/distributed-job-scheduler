"use strict";
/**
 * @file src/config/redis.ts
 * @description IORedis client singleton for BullMQ, caching, and pub/sub.
 * Exports separate connection instances for BullMQ (blocking) and general use.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisPublisher = exports.redisSubscriber = exports.bullmqConnection = exports.redisClient = void 0;
exports.checkRedisHealth = checkRedisHealth;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("./logger");
// ---------------------------------------------------------------------------
// Connection factory
// ---------------------------------------------------------------------------
function createRedisClient(name) {
    const client = new ioredis_1.default(env_1.env.REDIS_URL, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: false,
        reconnectOnError: (err) => {
            logger_1.logger.error(`[Redis:${name}] Connection error`, { error: err.message });
            return true; // Always attempt reconnect
        },
    });
    client.on('connect', () => {
        logger_1.logger.info(`[Redis:${name}] Connected`);
    });
    client.on('ready', () => {
        logger_1.logger.info(`[Redis:${name}] Ready`);
    });
    client.on('error', (err) => {
        logger_1.logger.error(`[Redis:${name}] Error`, { error: err.message });
    });
    client.on('close', () => {
        logger_1.logger.warn(`[Redis:${name}] Connection closed`);
    });
    client.on('reconnecting', () => {
        logger_1.logger.info(`[Redis:${name}] Reconnecting...`);
    });
    return client;
}
// ---------------------------------------------------------------------------
// Singleton instances
// ---------------------------------------------------------------------------
/**
 * General-purpose Redis client for caching, token blacklisting, session management.
 */
exports.redisClient = createRedisClient('main');
/**
 * Dedicated connection for BullMQ workers (requires maxRetriesPerRequest: null).
 * BullMQ requires a separate connection per queue to avoid blocking.
 */
exports.bullmqConnection = createRedisClient('bullmq');
/**
 * Pub/Sub subscriber connection. Cannot be used for regular commands.
 */
exports.redisSubscriber = createRedisClient('subscriber');
/**
 * Pub/Sub publisher connection.
 */
exports.redisPublisher = createRedisClient('publisher');
// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
/**
 * Pings the Redis server and returns true if healthy.
 */
async function checkRedisHealth() {
    try {
        const result = await exports.redisClient.ping();
        return result === 'PONG';
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=redis.js.map