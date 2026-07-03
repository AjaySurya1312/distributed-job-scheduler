/**
 * @file src/config/env.ts
 * @description Environment variable validation using Zod.
 * Validates all required env vars at startup and exits the process
 * with a descriptive error if any are missing or malformed.
 */
/**
 * Validated, typed environment configuration.
 * Import this instead of `process.env` for full type safety.
 *
 * @example
 * import { env } from '@/config/env';
 * const port = env.PORT; // number, not string
 */
export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    BCRYPT_ROUNDS: number;
    CORS_ORIGINS: string;
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX: number;
    API_BASE_URL: string;
    FRONTEND_URL: string;
};
/** Inferred TypeScript type of the validated environment object */
export type Env = typeof env;
//# sourceMappingURL=env.d.ts.map