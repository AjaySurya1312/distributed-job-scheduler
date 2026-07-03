"use strict";
/**
 * @file src/dtos/queue.dto.ts
 * @description Zod validation schemas for Queue-related request bodies and query params.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListQueuesQuerySchema = exports.UpdateQueueDtoSchema = exports.CreateQueueDtoSchema = void 0;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Create Queue
// ---------------------------------------------------------------------------
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
exports.CreateQueueDtoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Queue name is required').max(100),
    projectId: zod_1.z.string().uuid('Project ID must be a valid UUID'),
    description: zod_1.z.string().max(500).optional(),
    concurrency: zod_1.z.number().int().min(1).max(50).default(5),
    jobTimeoutMs: zod_1.z.number().int().min(1000).max(3_600_000).default(30_000),
    priority: zod_1.z.number().int().min(1).max(4).default(3),
    retryPolicyId: zod_1.z.string().uuid().optional(),
    rateLimit: zod_1.z.number().int().positive().optional(),
    rateLimitWindow: zod_1.z.number().int().positive().optional(),
});
// ---------------------------------------------------------------------------
// Update Queue (partial)
// ---------------------------------------------------------------------------
exports.UpdateQueueDtoSchema = exports.CreateQueueDtoSchema.partial().omit({
    projectId: true,
});
// ---------------------------------------------------------------------------
// List Queues Query
// ---------------------------------------------------------------------------
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
exports.ListQueuesQuerySchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid().optional(),
    isPaused: zod_1.z
        .string()
        .transform((v) => v === 'true')
        .pipe(zod_1.z.boolean())
        .optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
//# sourceMappingURL=queue.dto.js.map