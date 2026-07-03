/**
 * @file src/middlewares/error.middleware.ts
 * @description Global Express error handler.
 *
 * Handles:
 *   - AppError subclasses (ValidationError, NotFoundError, etc.) -> structured JSON
 *   - ZodError                                                    -> 422 with field details
 *   - Prisma errors (P2002 unique, P2025 not found)              -> 409 / 404
 *   - Unknown errors                                              -> 500, sanitised in prod
 *
 * Response shape (error):
 *   { success: false, error: { code, message, details?, requestId? } }
 */
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
/**
 * Express 4-argument error handler.
 * Must be registered LAST in the middleware chain with `app.use(errorHandler)`.
 *
 * @example
 * app.use(errorHandler);
 */
export declare const errorHandler: ErrorRequestHandler;
/**
 * Middleware that converts unmatched routes into structured 404 responses.
 * Register AFTER all routes, BEFORE the error handler.
 *
 * @example
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
export declare const notFoundHandler: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map