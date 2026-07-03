/**
 * @file env.ts
 * @description Environment variable validation and typed configuration for the Worker Service.
 *
 * All environment variables are validated at startup using Zod. If required variables
 * are missing or invalid, the process exits immediately with a descriptive error.
 */
import { z } from 'zod';
/**
 * Zod schema for all environment variables consumed by the worker.
 */
declare const envSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodString;
    /** Number of concurrent jobs this worker processes at once. Default: 5 */
    WORKER_CONCURRENCY: z.ZodEffects<z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>, number, string | undefined>;
    /** Comma-separated list of queue slugs this worker subscribes to. Default: 'default' */
    WORKER_QUEUES: z.ZodEffects<z.ZodDefault<z.ZodString>, string[], string | undefined>;
    /** How often the worker publishes a heartbeat. Default: 10 000 ms */
    HEARTBEAT_INTERVAL_MS: z.ZodEffects<z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>, number, string | undefined>;
    /** How often the lease manager scans for stale workers. Default: 15 000 ms */
    LEASE_CHECK_INTERVAL_MS: z.ZodEffects<z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>, number, string | undefined>;
    /** Time after last heartbeat before a worker is considered stale. Default: 30 000 ms */
    WORKER_STALE_THRESHOLD_MS: z.ZodEffects<z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>, number, string | undefined>;
    /** Whether this instance should run the lease manager. Default: 'false' */
    ENABLE_LEASE_MANAGER: z.ZodEffects<z.ZodDefault<z.ZodString>, boolean, string | undefined>;
    /** Whether this instance should run the cron scheduler. Default: 'false' */
    ENABLE_SCHEDULER: z.ZodEffects<z.ZodDefault<z.ZodString>, boolean, string | undefined>;
    /** Winston log level. Default: 'info' */
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "http", "verbose", "debug", "silly"]>>;
    /** Runtime environment. Default: 'development' */
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL: string;
    REDIS_URL: string;
    WORKER_CONCURRENCY: number;
    WORKER_QUEUES: string[];
    HEARTBEAT_INTERVAL_MS: number;
    LEASE_CHECK_INTERVAL_MS: number;
    WORKER_STALE_THRESHOLD_MS: number;
    ENABLE_LEASE_MANAGER: boolean;
    ENABLE_SCHEDULER: boolean;
    LOG_LEVEL: "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";
    NODE_ENV: "development" | "production" | "test";
}, {
    DATABASE_URL: string;
    REDIS_URL: string;
    WORKER_CONCURRENCY?: string | undefined;
    WORKER_QUEUES?: string | undefined;
    HEARTBEAT_INTERVAL_MS?: string | undefined;
    LEASE_CHECK_INTERVAL_MS?: string | undefined;
    WORKER_STALE_THRESHOLD_MS?: string | undefined;
    ENABLE_LEASE_MANAGER?: string | undefined;
    ENABLE_SCHEDULER?: string | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly" | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
}>;
/**
 * Inferred TypeScript type of the validated environment object.
 */
export type Env = z.infer<typeof envSchema>;
/**
 * Singleton validated environment object.
 * Import this throughout the worker codebase.
 *
 * @example
 * import { env } from '@/config/env';
 * console.log(env.REDIS_URL);
 */
export declare const env: Env;
export {};
//# sourceMappingURL=env.d.ts.map