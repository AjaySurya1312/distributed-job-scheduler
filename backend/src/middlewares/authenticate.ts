/**
 * @file src/middlewares/authenticate.ts
 * @description JWT authentication middleware.
 * Validates Bearer token, checks blacklist in Redis, and injects user context.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { redisClient } from '../config/redis';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../config/logger';

/**
 * Express middleware that validates the Authorization: Bearer <token> header.
 * On success, populates req.userId, req.userEmail, req.orgId, req.userRole, req.jti.
 * On failure, calls next() with UnauthorizedError.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing Authorization header');
    }

    const token = authHeader.slice(7);

    // Decode and verify JWT
    const payload = verifyAccessToken(token);

    // Check token blacklist (logged-out tokens)
    const blacklistKey = `blacklist:${payload.jti}`;
    const isBlacklisted = await redisClient.get(blacklistKey);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Attach user context to request
    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.orgId = payload.orgId;
    req.userRole = payload.role as import('@prisma/client').Role;
    req.jti = payload.jti;

    next();
  } catch (err) {
    logger.debug('Authentication failed', {
      path: req.path,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    next(err);
  }
}
