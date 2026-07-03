"use strict";
/**
 * @file src/middlewares/auth.middleware.ts
 * @description Authentication and authorisation middlewares.
 *
 * Provides:
 *   - authenticate    : Strict JWT Bearer token verification (req.user required)
 *   - optionalAuth    : Attaches user if token present; continues unauthenticated if not
 *   - requireRole     : RBAC guard — allow only specific roles
 *   - apiKeyAuth      : Validates X-API-Key header via SHA-256 hash lookup in DB
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = exports.optionalAuth = exports.authenticate = void 0;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
const password_1 = require("../utils/password");
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const errors_1 = require("../utils/errors");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Extracts the Bearer token from the Authorization header.
 * Returns `null` if the header is absent or malformed.
 */
function extractBearerToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
}
// ---------------------------------------------------------------------------
// authenticate
// ---------------------------------------------------------------------------
/**
 * Strict authentication middleware.
 * Verifies the `Authorization: Bearer <token>` header and attaches the
 * decoded payload to `req.user`. Rejects the request with 401 if the
 * token is absent, expired, or invalid.
 *
 * @example
 * router.get('/profile', authenticate, profileController.get);
 */
const authenticate = (req, _res, next) => {
    try {
        const token = extractBearerToken(req);
        if (!token) {
            throw new errors_1.AuthenticationError('Missing Authorization header. Expected: Bearer <token>');
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = {
            id: payload.userId,
            email: payload.email,
            organizationId: payload.organizationId,
            role: payload.role,
        };
        logger_1.logger.debug('Request authenticated', {
            userId: payload.userId,
            requestId: req.requestId,
        });
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.authenticate = authenticate;
// ---------------------------------------------------------------------------
// optionalAuth
// ---------------------------------------------------------------------------
/**
 * Optional authentication middleware.
 * If a valid Bearer token is present, `req.user` is populated.
 * If no token is present, the request continues unauthenticated (req.user = undefined).
 * If a token IS present but is invalid/expired, the request is rejected (401).
 *
 * Useful for endpoints that serve public data but enhance it for logged-in users.
 *
 * @example
 * router.get('/posts', optionalAuth, postsController.list);
 */
const optionalAuth = (req, _res, next) => {
    try {
        const token = extractBearerToken(req);
        if (!token) {
            // No token provided — continue unauthenticated
            return next();
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = {
            id: payload.userId,
            email: payload.email,
            organizationId: payload.organizationId,
            role: payload.role,
        };
        next();
    }
    catch (err) {
        // Token present but invalid — treat as auth failure
        next(err);
    }
};
exports.optionalAuth = optionalAuth;
// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------
/**
 * Role-based access control middleware factory.
 * Must be used AFTER `authenticate` (requires `req.user` to be set).
 *
 * Role hierarchy (most privileged to least):
 *   OWNER > ADMIN > MEMBER > VIEWER
 *
 * @param roles - One or more roles that are allowed to proceed
 * @returns A RequestHandler that enforces the role constraint
 *
 * @example
 * // Only owners and admins can delete
 * router.delete('/:id', authenticate, requireRole('OWNER', 'ADMIN'), handler);
 */
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errors_1.AuthenticationError('Authentication required before role check'));
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.warn('Authorisation denied — insufficient role', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                requestId: req.requestId,
                path: req.path,
            });
            return next(new errors_1.AuthorizationError(`This action requires one of the following roles: ${roles.join(', ')}`));
        }
        next();
    };
}
// ---------------------------------------------------------------------------
// apiKeyAuth
// ---------------------------------------------------------------------------
/**
 * API key authentication middleware.
 * Reads the `X-API-Key` header, hashes it with SHA-256, and looks it up in
 * the database. On success, populates `req.user` from the associated user record.
 *
 * Security note: We never store raw API keys — only SHA-256 hashes.
 * Comparison is done by hashing the incoming key and looking up the hash,
 * which avoids timing attack surface present with naive string comparison.
 *
 * @example
 * router.post('/ingest', apiKeyAuth, ingestController.create);
 */
const apiKeyAuth = async (req, _res, next) => {
    try {
        const rawKey = req.headers['x-api-key'];
        if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length === 0) {
            throw new errors_1.AuthenticationError('Missing X-API-Key header');
        }
        const keyHash = (0, password_1.hashApiKey)(rawKey.trim());
        // Lookup by hash — join to user and membership for role context
        // The `deletedAt: null` filter is handled by the Prisma soft-delete middleware
        const apiKey = await prisma_1.prisma.apiKey.findUnique({
            where: { hash: keyHash },
            include: {
                user: {
                    include: {
                        memberships: {
                            where: { deletedAt: null },
                            take: 1,
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                },
            },
        });
        if (!apiKey) {
            throw new errors_1.AuthenticationError('Invalid API key');
        }
        if (apiKey.revokedAt !== null) {
            throw new errors_1.AuthenticationError('This API key has been revoked');
        }
        if (apiKey.expiresAt !== null && apiKey.expiresAt < new Date()) {
            throw new errors_1.AuthenticationError('This API key has expired');
        }
        const membership = apiKey.user?.memberships?.[0];
        if (!membership) {
            throw new errors_1.AuthenticationError('API key is not associated with an active organisation membership');
        }
        req.user = {
            id: apiKey.user.id,
            email: apiKey.user.email,
            organizationId: membership.organizationId,
            role: membership.role,
        };
        // Update last-used timestamp asynchronously (fire-and-forget)
        prisma_1.prisma.apiKey
            .update({
            where: { id: apiKey.id },
            data: { lastUsedAt: new Date() },
        })
            .catch((err) => {
            logger_1.logger.warn('Failed to update apiKey.lastUsedAt', {
                apiKeyId: apiKey.id,
                error: err.message,
            });
        });
        logger_1.logger.debug('Request authenticated via API key', {
            apiKeyId: apiKey.id,
            userId: apiKey.user.id,
            requestId: req.requestId,
        });
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.apiKeyAuth = apiKeyAuth;
//# sourceMappingURL=auth.middleware.js.map