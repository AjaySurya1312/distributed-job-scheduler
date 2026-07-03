/**
 * @file src/middlewares/validate.middleware.ts
 * @description Zod-based request validation middlewares for body, query, and params.
 * Throws `ValidationError` with structured field-level details on failure.
 */
import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
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
export declare function validate(schema: ZodSchema): RequestHandler;
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
export declare function validateQuery(schema: ZodSchema): RequestHandler;
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
export declare function validateParams(schema: ZodSchema): RequestHandler;
//# sourceMappingURL=validate.middleware.d.ts.map