/**
 * @file src/middlewares/requireRole.ts
 * @description Role-based access control (RBAC) middleware.
 * Must be used after authenticate middleware.
 */
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
/**
 * Returns a middleware that ensures the authenticated user has at least one
 * of the specified roles.
 *
 * @param allowedRoles - One or more roles that are permitted to access the route
 *
 * @example
 * router.post('/api-keys', authenticate, requireRole('OWNER', 'ADMIN'), handler)
 */
export declare function requireRole(...allowedRoles: Role[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Convenience middleware: requires OWNER or ADMIN role.
 */
export declare const requireAdmin: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Convenience middleware: requires OWNER role only.
 */
export declare const requireOwner: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=requireRole.d.ts.map