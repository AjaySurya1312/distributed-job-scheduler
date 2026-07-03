"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
// ---------------------------------------------------------------------------
// Prisma error code map
// ---------------------------------------------------------------------------
/**
 * Maps Prisma's well-known error codes to AppError subclasses.
 * https://www.prisma.io/docs/reference/api-reference/error-reference
 */
function mapPrismaError(err) {
    switch (err.code) {
        case 'P2002': {
            // Unique constraint violation
            const fields = err.meta?.target ?? ['field'];
            return new errors_1.ConflictError(`A record with the same ${fields.join(', ')} already exists`, { prismaCode: err.code, fields });
        }
        case 'P2025':
            // Record not found (e.g. update/delete where clause matched nothing)
            return new errors_1.NotFoundError(err.meta?.cause ?? 'Record not found', { prismaCode: err.code });
        case 'P2003':
            // Foreign key constraint failure
            return new errors_1.ConflictError('Related record does not exist — foreign key constraint failed', { prismaCode: err.code, field: err.meta?.field_name });
        case 'P2014':
            // Required relation violation
            return new errors_1.ConflictError('This operation would violate a required relation constraint', { prismaCode: err.code });
        case 'P2000':
            // Value too long for column
            return new errors_1.ValidationError('One or more values are too long for their respective fields', { prismaCode: err.code, column: err.meta?.column_name });
        default:
            return new errors_1.InternalError('A database error occurred', { prismaCode: err.code });
    }
}
// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
/**
 * Express 4-argument error handler.
 * Must be registered LAST in the middleware chain with `app.use(errorHandler)`.
 *
 * @example
 * app.use(errorHandler);
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err, req, res, _next) => {
    const requestId = req.requestId;
    // ------------------------------------------------------------------
    // 1. AppError (our own hierarchy)
    // ------------------------------------------------------------------
    if ((0, errors_1.isAppError)(err)) {
        logger_1.logger.warn('Application error', {
            code: err.code,
            statusCode: err.statusCode,
            message: err.message,
            requestId,
            path: req.path,
            method: req.method,
            // Only log details at debug level to avoid noisy prod logs
        });
        const body = {
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
                requestId,
            },
        };
        res.status(err.statusCode).json(body);
        return;
    }
    // ------------------------------------------------------------------
    // 2. ZodError (direct throws — normally caught by validate middleware,
    //    but guard here for safety)
    // ------------------------------------------------------------------
    if (err instanceof zod_1.ZodError) {
        logger_1.logger.warn('Zod validation error (unhandled)', {
            requestId,
            path: req.path,
            issues: err.issues,
        });
        const body = {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: err.flatten().fieldErrors,
                requestId,
            },
        };
        res.status(422).json(body);
        return;
    }
    // ------------------------------------------------------------------
    // 3. Prisma known request errors
    // ------------------------------------------------------------------
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const appError = mapPrismaError(err);
        logger_1.logger.warn('Prisma known error', {
            code: err.code,
            message: err.message,
            requestId,
            path: req.path,
        });
        const body = {
            success: false,
            error: {
                code: appError.code,
                message: appError.message,
                details: appError.details,
                requestId,
            },
        };
        res.status(appError.statusCode).json(body);
        return;
    }
    // ------------------------------------------------------------------
    // 4. Prisma validation errors (schema-level, e.g. wrong field type)
    // ------------------------------------------------------------------
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        logger_1.logger.error('Prisma validation error', {
            message: err.message,
            requestId,
            path: req.path,
        });
        const body = {
            success: false,
            error: {
                code: 'DATABASE_VALIDATION_ERROR',
                message: 'Invalid data provided to the database layer',
                requestId,
            },
        };
        res.status(400).json(body);
        return;
    }
    // ------------------------------------------------------------------
    // 5. Unknown / unexpected errors -> 500
    // ------------------------------------------------------------------
    const error = err;
    logger_1.logger.error('Unhandled error', {
        message: error?.message ?? 'Unknown error',
        stack: error?.stack,
        requestId,
        path: req.path,
        method: req.method,
    });
    const body = {
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: env_1.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred. Please try again later.'
                : (error?.message ?? 'Unknown internal error'),
            // Include stack in development for faster debugging
            details: env_1.env.NODE_ENV !== 'production' ? { stack: error?.stack } : undefined,
            requestId,
        },
    };
    res.status(500).json(body);
};
exports.errorHandler = errorHandler;
// ---------------------------------------------------------------------------
// 404 catch-all (no route matched)
// ---------------------------------------------------------------------------
/**
 * Middleware that converts unmatched routes into structured 404 responses.
 * Register AFTER all routes, BEFORE the error handler.
 *
 * @example
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
const notFoundHandler = (req, _res, next) => {
    next(new errors_1.NotFoundError(`Route ${req.method} ${req.path} not found`));
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map