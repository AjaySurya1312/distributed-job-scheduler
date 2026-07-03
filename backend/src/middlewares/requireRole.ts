/**
 * @file src/middlewares/requireRole.ts
 * @description Role-based access control (RBAC) middleware.
 * Must be used after authenticate middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Role hierarchy — higher index = more permissions.
 * Used to implement "at least" permission checks.
 */
const ROLE_HIERARCHY: Role[] = [
  Role.VIEWER,
  Role.MEMBER,
  Role.ADMIN,
  Role.OWNER,
];

/**
 * Returns a middleware that ensures the authenticated user has at least one
 * of the specified roles.
 *
 * @param allowedRoles - One or more roles that are permitted to access the route
 *
 * @example
 * router.post('/api-keys', authenticate, requireRole('OWNER', 'ADMIN'), handler)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userId || !req.userRole) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRoleIndex = ROLE_HIERARCHY.indexOf(req.userRole);
    const hasPermission = allowedRoles.some(
      (role) => ROLE_HIERARCHY.indexOf(role) <= userRoleIndex,
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `This action requires one of: [${allowedRoles.join(', ')}]. Your role: ${req.userRole}`,
        ),
      );
    }

    next();
  };
}

/**
 * Convenience middleware: requires OWNER or ADMIN role.
 */
export const requireAdmin = requireRole(Role.OWNER, Role.ADMIN);

/**
 * Convenience middleware: requires OWNER role only.
 */
export const requireOwner = requireRole(Role.OWNER);
