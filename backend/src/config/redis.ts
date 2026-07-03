/**
 * @file src/config/redis.ts
 * @description IORedis client singleton for BullMQ, caching, and pub/sub.
 * Exports separate connection instances for BullMQ (blocking) and general use.
 */

import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// Connection factory
// ---------------------------------------------------------------------------

function createRedisClient(name: string): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: false,
    reconnectOnError: (err) => {
      logger.error(`[Redis:${name}] Connection error`, { error: err.message });
      return true; // Always attempt reconnect
    },
  });

  client.on('connect', () => {
    logger.info(`[Redis:${name}] Connected`);
  });

  client.on('ready', () => {
    logger.info(`[Redis:${name}] Ready`);
  });

  client.on('error', (err) => {
    logger.error(`[Redis:${name}] Error`, { error: err.message });
  });

  client.on('close', () => {
    logger.warn(`[Redis:${name}] Connection closed`);
  });

  client.on('reconnecting', () => {
    logger.info(`[Redis:${name}] Reconnecting...`);
  });

  return client;
}

// ---------------------------------------------------------------------------
// Singleton instances
// ---------------------------------------------------------------------------

/**
 * General-purpose Redis client for caching, token blacklisting, session management.
 */
export const redisClient = createRedisClient('main');

/**
 * Dedicated connection for BullMQ workers (requires maxRetriesPerRequest: null).
 * BullMQ requires a separate connection per queue to avoid blocking.
 */
export const bullmqConnection = createRedisClient('bullmq');

/**
 * Pub/Sub subscriber connection. Cannot be used for regular commands.
 */
export const redisSubscriber = createRedisClient('subscriber');

/**
 * Pub/Sub publisher connection.
 */
export const redisPublisher = createRedisClient('publisher');

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

/**
 * Pings the Redis server and returns true if healthy.
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
