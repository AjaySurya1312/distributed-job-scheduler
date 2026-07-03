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

import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// ─── Reconnect Strategy ───────────────────────────────────────────────────────

/**
 * Exponential back-off with a cap of 30 s.
 * Returns `null` after 20 consecutive failures to surface the error
 * instead of silently retrying forever.
 */
function reconnectStrategy(times: number): number | null {
  if (times > 20) {
    logger.error('Redis reconnect limit reached. Giving up.', { attempts: times });
    return null; // stop retrying
  }
  const delay = Math.min(100 * Math.pow(2, times), 30_000);
  logger.warn('Redis reconnecting…', { attempt: times, delayMs: delay });
  return delay;
}

// ─── Shared Options ───────────────────────────────────────────────────────────

const REDIS_OPTIONS: RedisOptions = {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: true,
  retryStrategy: reconnectStrategy,
  lazyConnect: false,
  showFriendlyErrorStack: env.NODE_ENV !== 'production',
  connectTimeout: 10_000,
  commandTimeout: 5_000,
};

// ─── Singleton Factory ────────────────────────────────────────────────────────

function createRedisClient(label: string, options: RedisOptions = {}): Redis {
  const client = new Redis(env.REDIS_URL, { ...REDIS_OPTIONS, ...options });

  client.on('connect', () => logger.info(`Redis [${label}] connecting…`));
  client.on('ready', () => logger.info(`Redis [${label}] ready`));
  client.on('error', (err: Error) =>
    logger.error(`Redis [${label}] error`, { error: err }),
  );
  client.on('close', () => logger.warn(`Redis [${label}] connection closed`));
  client.on('reconnecting', (delay: number) =>
    logger.warn(`Redis [${label}] reconnecting in ${delay}ms`),
  );
  client.on('end', () => logger.warn(`Redis [${label}] connection ended permanently`));

  return client;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Primary IORedis client for general commands (HSET, EXPIRE, LPUSH, …).
 * Shared across HeartbeatService, LeaseManagerService, and the job processor.
 */
export const redis: Redis = createRedisClient('main');

/**
 * Dedicated IORedis client used exclusively for PUBLISH commands.
 * Kept separate from the main client to prevent any mode conflicts.
 */
export const publisherRedis: Redis = createRedisClient('publisher');

/**
 * Factory that creates a fresh Redis client suitable for use as a BullMQ
 * connection. BullMQ requires `maxRetriesPerRequest: null`.
 *
 * @returns A new Redis instance pre-configured for BullMQ.
 */
export function createBullMQRedisClient(): Redis {
  return createRedisClient('bullmq', { maxRetriesPerRequest: null });
}

/**
 * Gracefully closes all shared Redis connections.
 * Call this during graceful shutdown before `process.exit`.
 */
export async function closeRedisConnections(): Promise<void> {
  logger.info('Closing Redis connections…');
  await Promise.allSettled([redis.quit(), publisherRedis.quit()]);
  logger.info('Redis connections closed');
}
