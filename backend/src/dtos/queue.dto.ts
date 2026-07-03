/**
 * @file src/dtos/queue.dto.ts
 * @description Zod validation schemas for Queue-related request bodies and query params.
 */

import { z } from 'zod';

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
export const CreateQueueDtoSchema = z.object({
  name: z.string().min(1, 'Queue name is required').max(100),
  projectId: z.string().uuid('Project ID must be a valid UUID'),
  description: z.string().max(500).optional(),
  concurrency: z.number().int().min(1).max(50).default(5),
  jobTimeoutMs: z.number().int().min(1000).max(3_600_000).default(30_000),
  priority: z.number().int().min(1).max(4).default(3),
  retryPolicyId: z.string().uuid().optional(),
  rateLimit: z.number().int().positive().optional(),
  rateLimitWindow: z.number().int().positive().optional(),
});

export type CreateQueueDto = z.infer<typeof CreateQueueDtoSchema>;

// ---------------------------------------------------------------------------
// Update Queue (partial)
// ---------------------------------------------------------------------------

export const UpdateQueueDtoSchema = CreateQueueDtoSchema.partial().omit({
  projectId: true,
});

export type UpdateQueueDto = z.infer<typeof UpdateQueueDtoSchema>;

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
export const ListQueuesQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  isPaused: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean())
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ListQueuesQuery = z.infer<typeof ListQueuesQuerySchema>;
