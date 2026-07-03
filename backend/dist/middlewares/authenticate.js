"use strict";
/**
 * @file src/middlewares/authenticate.ts
 * @description JWT authentication middleware.
 * Validates Bearer token, checks blacklist in Redis, and injects user context.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../config/redis");
const errors_1 = require("../utils/errors");
const logger_1 = require("../config/logger");
/**
 * Express middleware that validates the Authorization: Bearer <token> header.
 * On success, populates req.userId, req.userEmail, req.orgId, req.userRole, req.jti.
 * On failure, calls next() with UnauthorizedError.
 */
async function authenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('Missing Authorization header');
        }
        const token = authHeader.slice(7);
        // Decode and verify JWT
        const payload = (0, jwt_1.verifyAccessToken)(token);
        // Check token blacklist (logged-out tokens)
        const blacklistKey = `blacklist:${payload.jti}`;
        const isBlacklisted = await redis_1.redisClient.get(blacklistKey);
        if (isBlacklisted) {
            throw new errors_1.UnauthorizedError('Token has been revoked');
        }
        // Attach user context to request
        req.userId = payload.sub;
        req.userEmail = payload.email;
        req.orgId = payload.orgId;
        req.userRole = payload.role;
        req.jti = payload.jti;
        next();
    }
    catch (err) {
        logger_1.logger.debug('Authentication failed', {
            path: req.path,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        next(err);
    }
}
//# sourceMappingURL=authenticate.js.map