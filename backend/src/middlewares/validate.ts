/**
 * @file src/middlewares/validate.ts
 * @description Zod schema validation middleware factory.
 * Validates req.body, req.params, and req.query against the provided Zod schema.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

type RequestPart = 'body' | 'query' | 'params';

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
export function validate(schema: AnyZodObject, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      // Replace the raw input with the parsed (coerced + defaulted) values
      req[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(
          new ValidationError('Request validation failed', details),
        );
      }
      next(err);
    }
  };
}
