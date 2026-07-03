/**
 * @file src/config/prisma.ts
 * @description Prisma Client singleton.
 * Prevents multiple PrismaClient instances in development (hot-reload safe).
 */
import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
/**
 * Singleton Prisma Client instance.
 * In production, always creates a new instance.
 * In development, reuses the global instance to avoid connection pool exhaustion
 * during hot module reloads.
 */
export declare const prisma: PrismaClient;
//# sourceMappingURL=prisma.d.ts.map