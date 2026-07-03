/**
 * @file src/middlewares/rateLimiter.ts
 * @description Express-rate-limit configurations for API and auth endpoints.
 */
/**
 * General API rate limiter � applied to all routes.
 */
export declare const rateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Stricter rate limiter for auth endpoints (login, register).
 * 10 attempts per 15 minutes per IP.
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map