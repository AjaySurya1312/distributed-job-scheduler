/**
 * @file src/middlewares/authenticate.ts
 * @description JWT authentication middleware.
 * Validates Bearer token, checks blacklist in Redis, and injects user context.
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Express middleware that validates the Authorization: Bearer <token> header.
 * On success, populates req.userId, req.userEmail, req.orgId, req.userRole, req.jti.
 * On failure, calls next() with UnauthorizedError.
 */
export declare function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=authenticate.d.ts.map