/**
 * @file src/middlewares/rate-limit.middleware.ts
 * @description Express rate limiters for different endpoint categories.
 *
 * Three limiters:
 *   - defaultLimiter    : 100 req / 15 min  — applied globally
 *   - authLimiter       : 10  req / 15 min  — auth endpoints (login, register, forgot-password)
 *   - jobSubmitLimiter  : 1000 req / 1 min  — high-volume job submission endpoints
 *
 * In production, swap `windowMs` / `max` from env vars and replace the in-memory
 * store with a Redis store (e.g. `rate-limit-redis` or `ioredis-express-rate-limit`)
 * to support horizontally scaled deployments.
 */
import { RateLimitRequestHandler } from 'express-rate-limit';
/**
 * Default rate limiter for all endpoints.
 * 100 requests per 15-minute rolling window per IP.
 *
 * @example
 * // Apply globally in app.ts
 * app.use(defaultLimiter);
 */
export declare const defaultLimiter: RateLimitRequestHandler;
/**
 * Strict rate limiter for authentication endpoints.
 * 10 requests per 15-minute window per IP.
 *
 * Apply to: POST /auth/login, POST /auth/register, POST /auth/forgot-password
 *
 * @example
 * router.post('/login', authLimiter, loginController);
 */
export declare const authLimiter: RateLimitRequestHandler;
/**
 * High-throughput rate limiter for job submission endpoints.
 * 1000 requests per 1-minute window per IP.
 *
 * Designed for CI/CD pipelines and automated tooling that submit jobs at
 * high frequency. Adjust based on observed traffic patterns.
 *
 * @example
 * router.post('/jobs', jobSubmitLimiter, authenticate, submitJob);
 */
export declare const jobSubmitLimiter: RateLimitRequestHandler;
/**
 * API key rate limiter for programmatic access endpoints.
 * 500 requests per 1-minute window per IP.
 *
 * @example
 * router.use('/api/v1', apiKeyLimiter, apiKeyAuth, router);
 */
export declare const apiKeyLimiter: RateLimitRequestHandler;
//# sourceMappingURL=rate-limit.middleware.d.ts.map