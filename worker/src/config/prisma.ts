/**
 * @file prisma.ts
 * @description Prisma Client singleton for the Worker Service.
 *
 * A single PrismaClient instance is shared across the entire worker process.
 * Prisma internally manages a connection pool, so instantiating it once is both
 * correct and performant. The singleton is also attached to `global` in
 * development to survive hot-module-reload without exhausting connections.
 *
 * Logging is set to `warn` and `error` in production; in development the
 * `query` event is also forwarded to Winston so slow/heavy queries are visible.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Extend globalThis so TypeScript knows about our dev-mode singleton. */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// ─── Log Levels ───────────────────────────────────────────────────────────────

const PRISMA_LOG_LEVELS: Prisma.LogDefinition[] =
  env.NODE_ENV === 'production'
    ? [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ]
    : [
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ];

// ─── Factory ──────────────────────────────────────────────────────────────────

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: PRISMA_LOG_LEVELS,
    datasources: {
      db: { url: env.DATABASE_URL },
    },
  });

  // Forward Prisma events to Winston.
  // Cast required because Prisma's event types depend on the `log` configuration.
  const typedClient = client as PrismaClient & {
    $on(event: 'query', cb: (e: Prisma.QueryEvent) => void): void;
    $on(event: 'info', cb: (e: Prisma.LogEvent) => void): void;
    $on(event: 'warn', cb: (e: Prisma.LogEvent) => void): void;
    $on(event: 'error', cb: (e: Prisma.LogEvent) => void): void;
  };

  if (env.NODE_ENV !== 'production') {
    typedClient.$on('query', (e) => {
      logger.debug('Prisma query', {
        query: e.query,
        params: e.params,
        durationMs: e.duration,
      });
    });

    typedClient.$on('info', (e) => {
      logger.info('Prisma info', { message: e.message });
    });
  }

  typedClient.$on('warn', (e) => {
    logger.warn('Prisma warning', { message: e.message });
  });

  typedClient.$on('error', (e) => {
    logger.error('Prisma error', { message: e.message });
  });

  return client;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

/**
 * Shared Prisma Client instance.
 *
 * In development, the instance is stored on `global` to survive ts-node-dev
 * hot reloads without accumulating idle database connections.
 *
 * @example
 * import { prisma } from '@/config/prisma';
 * const job = await prisma.job.findUnique({ where: { id } });
 */
export const prisma: PrismaClient =
  env.NODE_ENV === 'development'
    ? (globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient()))
    : createPrismaClient();

// ─── Shutdown Helper ──────────────────────────────────────────────────────────

/**
 * Disconnects the Prisma Client cleanly.
 * Call this during graceful shutdown before `process.exit`.
 */
export async function closePrismaConnection(): Promise<void> {
  logger.info('Disconnecting Prisma Client…');
  await prisma.$disconnect();
  logger.info('Prisma Client disconnected');
}
