/**
 * @file src/middlewares/requestId.ts
 * @description Assigns a unique UUID to each incoming request for distributed tracing.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Attaches a unique requestId to each request.
 * Sources the ID from x-request-id header if provided by an upstream proxy,
 * otherwise generates a new UUID.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}
