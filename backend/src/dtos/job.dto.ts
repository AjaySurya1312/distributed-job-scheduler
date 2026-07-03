/**
 * @file src/dtos/job.dto.ts
 * @description Zod validation schemas for Job-related request bodies and query params.
 */

import { z } from 'zod';
import { JobStatus, JobType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Create Job
// ---------------------------------------------------------------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateJobDto:
 *       type: object
 *       required: [name, queueId, type, payload]
 *       properties:
 *         name:
 *           type: string
 *         queueId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [IMMEDIATE, DELAYED, SCHEDULED, BATCH]
 *         payload:
 *           type: object
 *         priority:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *           default: 3
 *         runAt:
 *           type: string
 *           format: date-time
 *         cronExpression:
 *           type: string
 *         cronTimezone:
 *           type: string
 *         maxAttempts:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 3
 *         jobTimeoutMs:
 *           type: integer
 *           minimum: 1000
 *           maximum: 3600000
 *         idempotencyKey:
 *           type: string
 *         metadata:
 *           type: object
 *         batchId:
 *           type: string
 */
export const CreateJobDtoSchema = z
  .object({
    name: z.string().min(1, 'Job name is required').max(255),
    queueId: z.string().uuid('Queue ID must be a valid UUID'),
    type: z.nativeEnum(JobType),
    payload: z.record(z.unknown()),
    priority: z.number().int().min(1).max(4).default(3),
    runAt: z.coerce.date().optional(),
    cronExpression: z.string().optional(),
    cronTimezone: z.string().optional(),
    maxAttempts: z.number().int().min(1).max(10).default(3),
    jobTimeoutMs: z.number().int().min(1000).max(3_600_000).optional(),
    idempotencyKey: z.string().max(255).optional(),
    metadata: z.record(z.unknown()).optional(),
    batchId: z.string().max(255).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === JobType.DELAYED && !data.runAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'runAt is required for DELAYED jobs',
        path: ['runAt'],
      });
    }
    if (data.type === JobType.SCHEDULED && !data.cronExpression) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'cronExpression is required for SCHEDULED jobs',
        path: ['cronExpression'],
      });
    }
  });

export type CreateJobDto = z.infer<typeof CreateJobDtoSchema>;

// ---------------------------------------------------------------------------
// Update Job (partial)
// ---------------------------------------------------------------------------

export const UpdateJobDtoSchema = CreateJobDtoSchema.partial().omit({
  queueId: true,
  type: true,
});

export type UpdateJobDto = z.infer<typeof UpdateJobDtoSchema>;

// ---------------------------------------------------------------------------
// List Jobs Query
// ---------------------------------------------------------------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     ListJobsQuery:
 *       type: object
 *       properties:
 *         queueId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [PENDING, QUEUED, RUNNING, COMPLETED, FAILED, RETRYING, DEAD, CANCELLED]
 *         type:
 *           type: string
 *           enum: [IMMEDIATE, DELAYED, SCHEDULED, BATCH]
 *         search:
 *           type: string
 *         page:
 *           type: integer
 *           default: 1
 *         pageSize:
 *           type: integer
 *           default: 20
 *         sortBy:
 *           type: string
 *           enum: [createdAt, priority, status]
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 */
export const ListJobsQuerySchema = z.object({
  queueId: z.string().uuid().optional(),
  status: z.nativeEnum(JobStatus).optional(),
  type: z.nativeEnum(JobType).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListJobsQuery = z.infer<typeof ListJobsQuerySchema>;

// ---------------------------------------------------------------------------
// Retry Job
// ---------------------------------------------------------------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     RetryJobDto:
 *       type: object
 *       properties:
 *         resetAttempts:
 *           type: boolean
 */
export const RetryJobDtoSchema = z.object({
  resetAttempts: z.boolean().optional().default(false),
});

export type RetryJobDto = z.infer<typeof RetryJobDtoSchema>;
