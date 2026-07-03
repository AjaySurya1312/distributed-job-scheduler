/**
 * @file src/middlewares/rateLimiter.ts
 * @description Express-rate-limit configurations for API and auth endpoints.
 */

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { TooManyRequestsError } from '../utils/errors';

/**
 * General API rate limiter — applied to all routes.
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('API rate limit exceeded. Please slow down.'));
  },
  skip: (req) => req.method === 'OPTIONS',
});

/**
 * Stricter rate limiter for auth endpoints (login, register).
 * 10 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new TooManyRequestsError(
        'Too many authentication attempts. Please wait 15 minutes before trying again.',
      ),
    );
  },
});
