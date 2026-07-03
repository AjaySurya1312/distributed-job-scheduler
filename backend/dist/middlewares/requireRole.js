"use strict";
/**
 * @file src/middlewares/requireRole.ts
 * @description Role-based access control (RBAC) middleware.
 * Must be used after authenticate middleware.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwner = exports.requireAdmin = void 0;
exports.requireRole = requireRole;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
/**
 * Role hierarchy � higher index = more permissions.
 * Used to implement "at least" permission checks.
 */
const ROLE_HIERARCHY = [
    client_1.Role.VIEWER,
    client_1.Role.MEMBER,
    client_1.Role.ADMIN,
    client_1.Role.OWNER,
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
function requireRole(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.userId || !req.userRole) {
            return next(new errors_1.UnauthorizedError('Authentication required'));
        }
        const userRoleIndex = ROLE_HIERARCHY.indexOf(req.userRole);
        const hasPermission = allowedRoles.some((role) => ROLE_HIERARCHY.indexOf(role) <= userRoleIndex);
        if (!hasPermission) {
            return next(new errors_1.ForbiddenError(`This action requires one of: [${allowedRoles.join(', ')}]. Your role: ${req.userRole}`));
        }
        next();
    };
}
/**
 * Convenience middleware: requires OWNER or ADMIN role.
 */
exports.requireAdmin = requireRole(client_1.Role.OWNER, client_1.Role.ADMIN);
/**
 * Convenience middleware: requires OWNER role only.
 */
exports.requireOwner = requireRole(client_1.Role.OWNER);
//# sourceMappingURL=requireRole.js.map