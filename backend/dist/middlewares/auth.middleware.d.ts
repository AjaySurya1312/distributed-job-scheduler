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
import { RequestHandler } from 'express';
import { UserRole } from '../utils/jwt';
/**
 * Strict authentication middleware.
 * Verifies the `Authorization: Bearer <token>` header and attaches the
 * decoded payload to `req.user`. Rejects the request with 401 if the
 * token is absent, expired, or invalid.
 *
 * @example
 * router.get('/profile', authenticate, profileController.get);
 */
export declare const authenticate: RequestHandler;
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
export declare const optionalAuth: RequestHandler;
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
export declare function requireRole(...roles: UserRole[]): RequestHandler;
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
export declare const apiKeyAuth: RequestHandler;
//# sourceMappingURL=auth.middleware.d.ts.map