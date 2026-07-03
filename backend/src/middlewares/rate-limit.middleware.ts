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

import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { TooManyRequestsError } from '../utils/errors';

// ---------------------------------------------------------------------------
// Shared configuration
// ---------------------------------------------------------------------------

/**
 * Base rate limiter options shared by all limiters.
 * Each specific limiter overrides `windowMs` and `max`.
 */
const baseOptions: Partial<Options> = {
  /**
   * Use the real client IP from the `X-Forwarded-For` header when behind a
   * trusted reverse proxy (nginx, AWS ALB, Cloudflare). Set to the number of
   * trusted proxy hops in your infrastructure.
   *
   * Set `app.set('trust proxy', 1)` in your Express app when behind 1 proxy.
   */
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers (RFC 6585)
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers (deprecated)

  /**
   * Custom key generator: prefer X-Real-IP (set by nginx), fall back to
   * X-Forwarded-For first IP, then socket remote address.
   */
  keyGenerator: (req): string => {
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp) return realIp;

    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return req.socket.remoteAddress ?? 'unknown';
  },

  /**
   * Custom handler that throws an AppError instead of sending a raw response.
   * This lets the global error handler format the response consistently.
   */
  handler: (req, _res, next): void => {
    logger.warn('Rate limit exceeded', {
      ip: req.socket.remoteAddress,
      path: req.path,
      method: req.method,
      requestId: req.requestId,
    });

    next(
      new TooManyRequestsError(
        'Too many requests — please slow down and try again later',
      ),
    );
  },

  /**
   * Skip rate limiting for internal health checks.
   */
  skip: (req): boolean => {
    return req.path === '/health' || req.path === '/ping';
  },
};

// ---------------------------------------------------------------------------
// Limiters
// ---------------------------------------------------------------------------

/**
 * Default rate limiter for all endpoints.
 * 100 requests per 15-minute rolling window per IP.
 *
 * @example
 * // Apply globally in app.ts
 * app.use(defaultLimiter);
 */
export const defaultLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: env.RATE_LIMIT_WINDOW_MS, // default: 15 minutes (900_000 ms)
  max: env.RATE_LIMIT_MAX,            // default: 100 requests
  message: 'Too many requests from this IP — please try again in 15 minutes',
});

/**
 * Strict rate limiter for authentication endpoints.
 * 10 requests per 15-minute window per IP.
 *
 * Apply to: POST /auth/login, POST /auth/register, POST /auth/forgot-password
 *
 * @example
 * router.post('/login', authLimiter, loginController);
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts — please try again in 15 minutes',
});

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
export const jobSubmitLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: 'Job submission rate limit exceeded — please throttle your requests',
});

/**
 * API key rate limiter for programmatic access endpoints.
 * 500 requests per 1-minute window per IP.
 *
 * @example
 * router.use('/api/v1', apiKeyLimiter, apiKeyAuth, router);
 */
export const apiKeyLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  message: 'API rate limit exceeded — please reduce request frequency',
});
