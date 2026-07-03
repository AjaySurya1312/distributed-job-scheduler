"use strict";
/**
 * @file src/config/prisma.ts
 * @description Prisma Client singleton.
 * Prevents multiple PrismaClient instances in development (hot-reload safe).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
/**
 * Singleton Prisma Client instance.
 * In production, always creates a new instance.
 * In development, reuses the global instance to avoid connection pool exhaustion
 * during hot module reloads.
 */
exports.prisma = globalThis.__prisma ??
    new client_1.PrismaClient({
        log: [
            { level: 'query', emit: 'event' },
            { level: 'warn', emit: 'stdout' },
            { level: 'error', emit: 'stdout' },
        ],
    });
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = exports.prisma;
}
// Log slow queries (> 1000ms) in development
if (process.env.NODE_ENV === 'development') {
    // @ts-expect-error Prisma event typing
    exports.prisma.$on('query', (e) => {
        if (e.duration > 1000) {
            logger_1.logger.warn('Slow query detected', { query: e.query, durationMs: e.duration });
        }
    });
}
//# sourceMappingURL=prisma.js.map