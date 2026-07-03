/**
 * @file src/config/env.ts
 * @description Environment variable validation using Zod.
 * Validates all required env vars at startup and exits the process
 * with a descriptive error if any are missing or malformed.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file before validation
dotenv.config();

/**
 * Zod schema for all environment variables.
 * Provides type coercion, defaults, and validation constraints.
 */
const envSchema = z.object({
  /** Application runtime environment */
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  /** HTTP server port */
  PORT: z.string().transform(Number).default('3000'),

  /** PostgreSQL connection URL (Prisma format) */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  /** Redis connection URL */
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  /** JWT access token signing secret (min 32 chars) */
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),

  /** JWT refresh token signing secret (min 32 chars) */
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  /** JWT access token expiry (e.g. "15m", "1h") */
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),

  /** JWT refresh token expiry (e.g. "7d") */
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  /** bcrypt hashing rounds */
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  /** Comma-separated list of allowed CORS origins */
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  /** Winston log level */
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),

  /** Rate limit window in milliseconds (default: 15 minutes) */
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .default('900000'),

  /** Maximum requests per rate limit window */
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),

  /** Base URL for the API (used in email links etc.) */
  API_BASE_URL: z.string().url().default('http://localhost:3000'),

  /** Frontend application URL */
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

/**
 * Parse and validate environment variables.
 * If validation fails, log field-level errors and terminate the process.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:\n',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

/**
 * Validated, typed environment configuration.
 * Import this instead of `process.env` for full type safety.
 *
 * @example
 * import { env } from '@/config/env';
 * const port = env.PORT; // number, not string
 */
export const env = parsed.data;

/** Inferred TypeScript type of the validated environment object */
export type Env = typeof env;
