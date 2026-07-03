"use strict";
/**
 * @file src/dtos/job.dto.ts
 * @description Zod validation schemas for Job-related request bodies and query params.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryJobDtoSchema = exports.ListJobsQuerySchema = exports.UpdateJobDtoSchema = exports.CreateJobDtoSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
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
exports.CreateJobDtoSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1, 'Job name is required').max(255),
    queueId: zod_1.z.string().uuid('Queue ID must be a valid UUID'),
    type: zod_1.z.nativeEnum(client_1.JobType),
    payload: zod_1.z.record(zod_1.z.unknown()),
    priority: zod_1.z.number().int().min(1).max(4).default(3),
    runAt: zod_1.z.coerce.date().optional(),
    cronExpression: zod_1.z.string().optional(),
    cronTimezone: zod_1.z.string().optional(),
    maxAttempts: zod_1.z.number().int().min(1).max(10).default(3),
    jobTimeoutMs: zod_1.z.number().int().min(1000).max(3_600_000).optional(),
    idempotencyKey: zod_1.z.string().max(255).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    batchId: zod_1.z.string().max(255).optional(),
})
    .superRefine((data, ctx) => {
    if (data.type === client_1.JobType.DELAYED && !data.runAt) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'runAt is required for DELAYED jobs',
            path: ['runAt'],
        });
    }
    if (data.type === client_1.JobType.SCHEDULED && !data.cronExpression) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'cronExpression is required for SCHEDULED jobs',
            path: ['cronExpression'],
        });
    }
});
// ---------------------------------------------------------------------------
// Update Job (partial)
// ---------------------------------------------------------------------------
exports.UpdateJobDtoSchema = exports.CreateJobDtoSchema.partial().omit({
    queueId: true,
    type: true,
});
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
exports.ListJobsQuerySchema = zod_1.z.object({
    queueId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.nativeEnum(client_1.JobStatus).optional(),
    type: zod_1.z.nativeEnum(client_1.JobType).optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
    sortBy: zod_1.z.enum(['createdAt', 'priority', 'status']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
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
exports.RetryJobDtoSchema = zod_1.z.object({
    resetAttempts: zod_1.z.boolean().optional().default(false),
});
//# sourceMappingURL=job.dto.js.map