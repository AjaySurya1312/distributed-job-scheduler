/**
 * @file src/middlewares/requestId.ts
 * @description Assigns a unique UUID to each incoming request for distributed tracing.
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Attaches a unique requestId to each request.
 * Sources the ID from x-request-id header if provided by an upstream proxy,
 * otherwise generates a new UUID.
 */
export declare function requestId(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=requestId.d.ts.map