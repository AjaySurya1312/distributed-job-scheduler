"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.closePrismaConnection = closePrismaConnection;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
const logger_1 = require("./logger");
// ─── Log Levels ───────────────────────────────────────────────────────────────
const PRISMA_LOG_LEVELS = env_1.env.NODE_ENV === 'production'
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
function createPrismaClient() {
    const client = new client_1.PrismaClient({
        log: PRISMA_LOG_LEVELS,
        datasources: {
            db: { url: env_1.env.DATABASE_URL },
        },
    });
    // Forward Prisma events to Winston.
    // Cast required because Prisma's event types depend on the `log` configuration.
    const typedClient = client;
    if (env_1.env.NODE_ENV !== 'production') {
        typedClient.$on('query', (e) => {
            logger_1.logger.debug('Prisma query', {
                query: e.query,
                params: e.params,
                durationMs: e.duration,
            });
        });
        typedClient.$on('info', (e) => {
            logger_1.logger.info('Prisma info', { message: e.message });
        });
    }
    typedClient.$on('warn', (e) => {
        logger_1.logger.warn('Prisma warning', { message: e.message });
    });
    typedClient.$on('error', (e) => {
        logger_1.logger.error('Prisma error', { message: e.message });
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
exports.prisma = env_1.env.NODE_ENV === 'development'
    ? (globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient()))
    : createPrismaClient();
// ─── Shutdown Helper ──────────────────────────────────────────────────────────
/**
 * Disconnects the Prisma Client cleanly.
 * Call this during graceful shutdown before `process.exit`.
 */
async function closePrismaConnection() {
    logger_1.logger.info('Disconnecting Prisma Client…');
    await exports.prisma.$disconnect();
    logger_1.logger.info('Prisma Client disconnected');
}
//# sourceMappingURL=prisma.js.map