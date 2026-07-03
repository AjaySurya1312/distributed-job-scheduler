"use strict";
/**
 * @file src/middlewares/rateLimiter.ts
 * @description Express-rate-limit configurations for API and auth endpoints.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
/**
 * General API rate limiter � applied to all routes.
 */
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(new errors_1.TooManyRequestsError('API rate limit exceeded. Please slow down.'));
    },
    skip: (req) => req.method === 'OPTIONS',
});
/**
 * Stricter rate limiter for auth endpoints (login, register).
 * 10 attempts per 15 minutes per IP.
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(new errors_1.TooManyRequestsError('Too many authentication attempts. Please wait 15 minutes before trying again.'));
    },
});
//# sourceMappingURL=rateLimiter.js.map