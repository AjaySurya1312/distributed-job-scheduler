/**
 * @file src/middlewares/errorHandler.ts
 * @description Global Express error handling middleware.
 * Catches all errors forwarded via next(err), maps them to appropriate HTTP responses.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
}

/**
 * Maps Prisma-specific errors to appropriate AppError responses.
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  status: number;
  code: string;
  message: string;
} {
  switch (err.code) {
    case 'P2002': {
      const field = (err.meta?.target as string[])?.join(', ') ?? 'field';
      return { status: 409, code: 'CONFLICT', message: `A record with this ${field} already exists` };
    }
    case 'P2025':
      return { status: 404, code: 'NOT_FOUND', message: 'Record not found' };
    case 'P2003':
      return { status: 400, code: 'BAD_REQUEST', message: 'Referenced record does not exist' };
    case 'P2014':
      return { status: 400, code: 'BAD_REQUEST', message: 'Invalid relation' };
    default:
      return { status: 500, code: 'DATABASE_ERROR', message: 'A database error occurred' };
  }
}

/**
 * Global error handler — must be mounted LAST in Express middleware chain.
 * Signature must have 4 parameters for Express to recognise it as error middleware.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;

    // Only log operational errors at warn level; programming errors at error level
    if (err.isOperational) {
      logger.warn('Operational error', {
        code,
        message,
        path: req.path,
        method: req.method,
        requestId: req.requestId,
      });
    } else {
      logger.error('Non-operational AppError', {
        code,
        message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        requestId: req.requestId,
      });
    }
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = handlePrismaError(err);
    statusCode = mapped.status;
    code = mapped.code;
    message = mapped.message;
    logger.warn('Prisma error', {
      prismaCode: err.code,
      message: err.message,
      path: req.path,
      requestId: req.requestId,
    });
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid data provided to the database';
    logger.warn('Prisma validation error', { message: err.message, requestId: req.requestId });
  } else {
    // Unexpected programming error — log full stack
    logger.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId: req.requestId,
    });
  }

  const body: ErrorResponse = {
    success: false,
    code,
    message,
    details,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(body);
}

/**
 * 404 Not Found handler — mount before the global error handler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const { AppError: Err } = require('../utils/errors');
  next(new Err(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND'));
}
