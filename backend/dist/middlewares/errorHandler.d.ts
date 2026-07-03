/**
 * @file src/middlewares/errorHandler.ts
 * @description Global Express error handling middleware.
 * Catches all errors forwarded via next(err), maps them to appropriate HTTP responses.
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Global error handler � must be mounted LAST in Express middleware chain.
 * Signature must have 4 parameters for Express to recognise it as error middleware.
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
/**
 * 404 Not Found handler � mount before the global error handler.
 */
export declare function notFoundHandler(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map