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
import { PrismaClient } from '@prisma/client';
/** Extend globalThis so TypeScript knows about our dev-mode singleton. */
declare global {
    var __prisma: PrismaClient | undefined;
}
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
export declare const prisma: PrismaClient;
/**
 * Disconnects the Prisma Client cleanly.
 * Call this during graceful shutdown before `process.exit`.
 */
export declare function closePrismaConnection(): Promise<void>;
//# sourceMappingURL=prisma.d.ts.map