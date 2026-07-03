"use strict";
/**
 * @file src/middlewares/validate.middleware.ts
 * @description Zod-based request validation middlewares for body, query, and params.
 * Throws `ValidationError` with structured field-level details on failure.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
const errors_1 = require("../utils/errors");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Formats a ZodError into a structured map of field -> error messages[].
 * This is the same shape as Zod's `flatten().fieldErrors`.
 *
 * @param error - ZodError instance from a failed parse
 * @returns Record<string, string[]> — field path -> error messages
 */
function formatZodErrors(error) {
    return error.flatten().fieldErrors;
}
// ---------------------------------------------------------------------------
// validate (request body)
// ---------------------------------------------------------------------------
/**
 * Validates `req.body` against a Zod schema.
 * On success, replaces `req.body` with the parsed (and coerced) value.
 * On failure, calls `next(ValidationError)` with field-level details.
 *
 * @param schema - Zod schema to validate against
 * @returns Express `RequestHandler`
 *
 * @example
 * import { z } from 'zod';
 * const createUserSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 * router.post('/users', validate(createUserSchema), createUser);
 */
function validate(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const fieldErrors = formatZodErrors(result.error);
            return next(new errors_1.ValidationError('Request body validation failed', fieldErrors));
        }
        // Replace body with parsed data so downstream handlers get coerced types
        req.body = result.data;
        next();
    };
}
// ---------------------------------------------------------------------------
// validateQuery (query string params)
// ---------------------------------------------------------------------------
/**
 * Validates `req.query` against a Zod schema.
 * On success, replaces `req.query` with the parsed (and coerced) value.
 * On failure, calls `next(ValidationError)` with field-level details.
 *
 * Note: All query string values arrive as strings. Use `z.coerce.number()`
 * or `z.string().transform(Number)` for numeric query params.
 *
 * @param schema - Zod schema to validate against
 * @returns Express `RequestHandler`
 *
 * @example
 * const listQuerySchema = z.object({
 *   page: z.coerce.number().int().positive().default(1),
 *   pageSize: z.coerce.number().int().min(1).max(100).default(20),
 *   search: z.string().optional(),
 * });
 * router.get('/users', validateQuery(listQuerySchema), listUsers);
 */
function validateQuery(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const fieldErrors = formatZodErrors(result.error);
            return next(new errors_1.ValidationError('Query parameter validation failed', fieldErrors));
        }
        // Cast: Express's Request.query type is restrictive, but we know it's safe
        req.query = result.data;
        next();
    };
}
// ---------------------------------------------------------------------------
// validateParams (URL path parameters)
// ---------------------------------------------------------------------------
/**
 * Validates `req.params` against a Zod schema.
 * On success, replaces `req.params` with the parsed (and coerced) value.
 * On failure, calls `next(ValidationError)` with field-level details.
 *
 * @param schema - Zod schema to validate against
 * @returns Express `RequestHandler`
 *
 * @example
 * const uuidParamSchema = z.object({
 *   id: z.string().uuid('Invalid resource ID'),
 * });
 * router.get('/users/:id', validateParams(uuidParamSchema), getUser);
 */
function validateParams(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            const fieldErrors = formatZodErrors(result.error);
            return next(new errors_1.ValidationError('URL parameter validation failed', fieldErrors));
        }
        req.params = result.data;
        next();
    };
}
//# sourceMappingURL=validate.middleware.js.map