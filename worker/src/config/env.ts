/**
 * @file env.ts
 * @description Environment variable validation and typed configuration for the Worker Service.
 *
 * All environment variables are validated at startup using Zod. If required variables
 * are missing or invalid, the process exits immediately with a descriptive error.
 */

import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file before validation
dotenv.config();

/**
 * Zod schema for all environment variables consumed by the worker.
 */
const envSchema = z.object({
  // ─── Database ────────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // ─── Redis ───────────────────────────────────────────────────────────────────
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),

  // ─── Worker Configuration ────────────────────────────────────────────────────
  /** Number of concurrent jobs this worker processes at once. Default: 5 */
  WORKER_CONCURRENCY: z
    .string()
    .default('5')
    .transform((v) => parseInt(v, 10))
    .refine((n) => n >= 1 && n <= 100, 'WORKER_CONCURRENCY must be between 1 and 100'),

  /** Comma-separated list of queue slugs this worker subscribes to. Default: 'default' */
  WORKER_QUEUES: z
    .string()
    .default('default')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    ),

  // ─── Intervals (all in milliseconds) ─────────────────────────────────────────
  /** How often the worker publishes a heartbeat. Default: 10 000 ms */
  HEARTBEAT_INTERVAL_MS: z
    .string()
    .default('10000')
    .transform((v) => parseInt(v, 10))
    .refine((n) => n >= 1000, 'HEARTBEAT_INTERVAL_MS must be at least 1000ms'),

  /** How often the lease manager scans for stale workers. Default: 15 000 ms */
  LEASE_CHECK_INTERVAL_MS: z
    .string()
    .default('15000')
    .transform((v) => parseInt(v, 10))
    .refine((n) => n >= 5000, 'LEASE_CHECK_INTERVAL_MS must be at least 5000ms'),

  /** Time after last heartbeat before a worker is considered stale. Default: 30 000 ms */
  WORKER_STALE_THRESHOLD_MS: z
    .string()
    .default('30000')
    .transform((v) => parseInt(v, 10))
    .refine((n) => n >= 5000, 'WORKER_STALE_THRESHOLD_MS must be at least 5000ms'),

  // ─── Feature Flags ───────────────────────────────────────────────────────────
  /** Whether this instance should run the lease manager. Default: 'false' */
  ENABLE_LEASE_MANAGER: z
    .string()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),

  /** Whether this instance should run the cron scheduler. Default: 'false' */
  ENABLE_SCHEDULER: z
    .string()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),

  // ─── Logging ──────────────────────────────────────────────────────────────────
  /** Winston log level. Default: 'info' */
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),

  /** Runtime environment. Default: 'development' */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Inferred TypeScript type of the validated environment object.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate all environment variables. Exits the process on failure.
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌  Worker environment validation failed:\n');
    result.error.errors.forEach((err) => {
      console.error(`  [${err.path.join('.')}] ${err.message}`);
    });
    console.error('\nPlease fix the above variables in your .env file and restart.');
    process.exit(1);
  }

  return result.data;
}

/**
 * Singleton validated environment object.
 * Import this throughout the worker codebase.
 *
 * @example
 * import { env } from '@/config/env';
 * console.log(env.REDIS_URL);
 */
export const env: Env = validateEnv();
