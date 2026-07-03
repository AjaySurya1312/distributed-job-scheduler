/**
 * @file src/dtos/queue.dto.ts
 * @description Zod validation schemas for Queue-related request bodies and query params.
 */
import { z } from 'zod';
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateQueueDto:
 *       type: object
 *       required: [name, projectId]
 *       properties:
 *         name:
 *           type: string
 *         projectId:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *         concurrency:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *         jobTimeoutMs:
 *           type: integer
 *           default: 30000
 *         priority:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *           default: 3
 *         retryPolicyId:
 *           type: string
 *           format: uuid
 *         rateLimit:
 *           type: integer
 *         rateLimitWindow:
 *           type: integer
 */
export declare const CreateQueueDtoSchema: z.ZodObject<{
    name: z.ZodString;
    projectId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    jobTimeoutMs: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodNumber>;
    retryPolicyId: z.ZodOptional<z.ZodString>;
    rateLimit: z.ZodOptional<z.ZodNumber>;
    rateLimitWindow: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    projectId: string;
    priority: number;
    jobTimeoutMs: number;
    concurrency: number;
    retryPolicyId?: string | undefined;
    description?: string | undefined;
    rateLimit?: number | undefined;
    rateLimitWindow?: number | undefined;
}, {
    name: string;
    projectId: string;
    priority?: number | undefined;
    jobTimeoutMs?: number | undefined;
    retryPolicyId?: string | undefined;
    description?: string | undefined;
    concurrency?: number | undefined;
    rateLimit?: number | undefined;
    rateLimitWindow?: number | undefined;
}>;
export type CreateQueueDto = z.infer<typeof CreateQueueDtoSchema>;
export declare const UpdateQueueDtoSchema: z.ZodObject<Omit<{
    name: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    jobTimeoutMs: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    retryPolicyId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    rateLimit: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    rateLimitWindow: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "projectId">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    priority?: number | undefined;
    jobTimeoutMs?: number | undefined;
    retryPolicyId?: string | undefined;
    description?: string | undefined;
    concurrency?: number | undefined;
    rateLimit?: number | undefined;
    rateLimitWindow?: number | undefined;
}, {
    name?: string | undefined;
    priority?: number | undefined;
    jobTimeoutMs?: number | undefined;
    retryPolicyId?: string | undefined;
    description?: string | undefined;
    concurrency?: number | undefined;
    rateLimit?: number | undefined;
    rateLimitWindow?: number | undefined;
}>;
export type UpdateQueueDto = z.infer<typeof UpdateQueueDtoSchema>;
/**
 * @swagger
 * components:
 *   schemas:
 *     ListQueuesQuery:
 *       type: object
 *       properties:
 *         projectId:
 *           type: string
 *           format: uuid
 *         isPaused:
 *           type: boolean
 *         search:
 *           type: string
 *         page:
 *           type: integer
 *           default: 1
 *         pageSize:
 *           type: integer
 *           default: 20
 */
export declare const ListQueuesQuerySchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    isPaused: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, boolean, string>, z.ZodBoolean>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    search?: string | undefined;
    projectId?: string | undefined;
    isPaused?: boolean | undefined;
}, {
    search?: string | undefined;
    projectId?: string | undefined;
    isPaused?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export type ListQueuesQuery = z.infer<typeof ListQueuesQuerySchema>;
//# sourceMappingURL=queue.dto.d.ts.map