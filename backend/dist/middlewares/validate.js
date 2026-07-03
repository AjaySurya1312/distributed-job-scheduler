"use strict";
/**
 * @file src/middlewares/validate.ts
 * @description Zod schema validation middleware factory.
 * Validates req.body, req.params, and req.query against the provided Zod schema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
/**
 * Creates a middleware that validates the specified part of the request.
 *
 * @param schema - Zod object schema
 * @param part - Which part of the request to validate ('body' | 'query' | 'params')
 *
 * @example
 * router.post('/jobs', validate(CreateJobDtoSchema), handler);
 * router.get('/jobs', validate(ListJobsQuerySchema, 'query'), handler);
 */
function validate(schema, part = 'body') {
    return (req, _res, next) => {
        try {
            const parsed = schema.parse(req[part]);
            // Replace the raw input with the parsed (coerced + defaulted) values
            req[part] = parsed;
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const details = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                return next(new errors_1.ValidationError('Request validation failed', details));
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validate.js.map