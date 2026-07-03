/**
 * @file src/middlewares/validate.ts
 * @description Zod schema validation middleware factory.
 * Validates req.body, req.params, and req.query against the provided Zod schema.
 */
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
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
export declare function validate(schema: AnyZodObject, part?: RequestPart): (req: Request, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.d.ts.map