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

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { hashApiKey } from '../utils/password';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import {
  AuthenticationError,
  ForbiddenError as AuthorizationError,
} from '../utils/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the Bearer token from the Authorization header.
 * Returns `null` if the header is absent or malformed.
 */
function extractBearerToken(req: Request): string | null {
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
export const authenticate: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw new AuthenticationError(
        'Missing Authorization header. Expected: Bearer <token>',
      );
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
    };

    logger.debug('Request authenticated', {
      userId: payload.userId,
      requestId: req.requestId,
    });

    next();
  } catch (err) {
    next(err);
  }
};

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
export const optionalAuth: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      // No token provided — continue unauthenticated
      return next();
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
    };

    next();
  } catch (err) {
    // Token present but invalid — treat as auth failure
    next(err);
  }
};

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
export function requireRole(...roles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AuthenticationError('Authentication required before role check'),
      );
    }

    if (!roles.includes(req.user.role as string)) {
      logger.warn('Authorisation denied — insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        requestId: req.requestId,
        path: req.path,
      });

      return next(
        new AuthorizationError(
          `This action requires one of the following roles: ${roles.join(', ')}`,
        ),
      );
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
export const apiKeyAuth: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rawKey = req.headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length === 0) {
      throw new AuthenticationError(
        'Missing X-API-Key header',
      );
    }

    const keyHash = hashApiKey(rawKey.trim());

    // Lookup by hash — join to user and membership for role context
    // The `deletedAt: null` filter is handled by the Prisma soft-delete middleware
    const apiKey = await (prisma as any).apiKey.findUnique({
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
      throw new AuthenticationError('Invalid API key');
    }

    if (apiKey.revokedAt !== null) {
      throw new AuthenticationError('This API key has been revoked');
    }

    if (apiKey.expiresAt !== null && apiKey.expiresAt < new Date()) {
      throw new AuthenticationError('This API key has expired');
    }

    const membership = apiKey.user?.memberships?.[0];

    if (!membership) {
      throw new AuthenticationError(
        'API key is not associated with an active organisation membership',
      );
    }

    req.user = {
      id: apiKey.user.id,
      email: apiKey.user.email,
      organizationId: membership.organizationId,
      role: membership.role,
    };

    // Update last-used timestamp asynchronously (fire-and-forget)
    (prisma as any).apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err: Error) => {
        logger.warn('Failed to update apiKey.lastUsedAt', {
          apiKeyId: apiKey.id,
          error: err.message,
        });
      });

    logger.debug('Request authenticated via API key', {
      apiKeyId: apiKey.id,
      userId: apiKey.user.id,
      requestId: req.requestId,
    });

    next();
  } catch (err) {
    next(err);
  }
};
