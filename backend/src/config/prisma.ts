/**
 * @file src/config/prisma.ts
 * @description Prisma Client singleton.
 * Prevents multiple PrismaClient instances in development (hot-reload safe).
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // Allow globalThis augmentation for singleton pattern in dev
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma Client instance.
 * In production, always creates a new instance.
 * In development, reuses the global instance to avoid connection pool exhaustion
 * during hot module reloads.
 */
export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'warn', emit: 'stdout' },
      { level: 'error', emit: 'stdout' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Log slow queries (> 1000ms) in development
if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error Prisma event typing
  prisma.$on('query', (e: { query: string; duration: number }) => {
    if (e.duration > 1000) {
      logger.warn('Slow query detected', { query: e.query, durationMs: e.duration });
    }
  });
}
