/**
 * @file src/dtos/job.dto.ts
 * @description Zod validation schemas for Job-related request bodies and query params.
 */
import { z } from 'zod';
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
export declare const CreateJobDtoSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    queueId: z.ZodString;
    type: z.ZodNativeEnum<{
        IMMEDIATE: "IMMEDIATE";
        DELAYED: "DELAYED";
        SCHEDULED: "SCHEDULED";
        BATCH: "BATCH";
    }>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    priority: z.ZodDefault<z.ZodNumber>;
    runAt: z.ZodOptional<z.ZodDate>;
    cronExpression: z.ZodOptional<z.ZodString>;
    cronTimezone: z.ZodOptional<z.ZodString>;
    maxAttempts: z.ZodDefault<z.ZodNumber>;
    jobTimeoutMs: z.ZodOptional<z.ZodNumber>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    batchId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "IMMEDIATE" | "DELAYED" | "SCHEDULED" | "BATCH";
    name: string;
    queueId: string;
    payload: Record<string, unknown>;
    priority: number;
    maxAttempts: number;
    runAt?: Date | undefined;
    cronExpression?: string | undefined;
    cronTimezone?: string | undefined;
    jobTimeoutMs?: number | undefined;
    idempotencyKey?: string | undefined;
    batchId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    type: "IMMEDIATE" | "DELAYED" | "SCHEDULED" | "BATCH";
    name: string;
    queueId: string;
    payload: Record<string, unknown>;
    priority?: number | undefined;
    maxAttempts?: number | undefined;
    runAt?: Date | undefined;
    cronExpression?: string | undefined;
    cronTimezone?: string | undefined;
    jobTimeoutMs?: number | undefined;
    idempotencyKey?: string | undefined;
    batchId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>, {
    type: "IMMEDIATE" | "DELAYED" | "SCHEDULED" | "BATCH";
    name: string;
    queueId: string;
    payload: Record<string, unknown>;
    priority: number;
    maxAttempts: number;
    runAt?: Date | undefined;
    cronExpression?: string | undefined;
    cronTimezone?: string | undefined;
    jobTimeoutMs?: number | undefined;
    idempotencyKey?: string | undefined;
    batchId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    type: "IMMEDIATE" | "DELAYED" | "SCHEDULED" | "BATCH";
    name: string;
    queueId: string;
    payload: Record<string, unknown>;
    priority?: number | undefined;
    maxAttempts?: number | undefined;
    runAt?: Date | undefined;
    cronExpression?: string | undefined;
    cronTimezone?: string | undefined;
    jobTimeoutMs?: number | undefined;
    idempotencyKey?: string | undefined;
    batchId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type CreateJobDto = z.infer<typeof CreateJobDtoSchema>;
export declare const UpdateJobDtoSchema: any;
export type UpdateJobDto = z.infer<typeof UpdateJobDtoSchema>;
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
export declare const ListJobsQuerySchema: z.ZodObject<{
    queueId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        PENDING: "PENDING";
        QUEUED: "QUEUED";
        RUNNING: "RUNNING";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
        RETRYING: "RETRYING";
        DEAD: "DEAD";
        CANCELLED: "CANCELLED";
    }>>;
    type: z.ZodOptional<z.ZodNativeEnum<{
        IMMEDIATE: "IMMEDIATE";
        DELAYED: "DELAYED";
        SCHEDULED: "SCHEDULED";
        BATCH: "BATCH";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "priority", "status"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sortBy: "status" | "createdAt" | "priority";
    sortOrder: "asc" | "desc";
    type?: "IMMEDIATE" | "DELAYED" | "SCHEDULED" | "BATCH" | undefined;
    status?: "PENDING" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "RETRYING" | "DEAD" | "CANCELLED" | undefined;
    search?: string | undefined;
    queueId?: string | undefined;
}, {
    type?: "IMMEDIATE" | "DELAYED" | "SCHEDULED" | "BATCH" | undefined;
    status?: "PENDING" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "RETRYING" | "DEAD" | "CANCELLED" | undefined;
    search?: string | undefined;
    queueId?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    sortBy?: "status" | "createdAt" | "priority" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type ListJobsQuery = z.infer<typeof ListJobsQuerySchema>;
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
export declare const RetryJobDtoSchema: z.ZodObject<{
    resetAttempts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    resetAttempts: boolean;
}, {
    resetAttempts?: boolean | undefined;
}>;
export type RetryJobDto = z.infer<typeof RetryJobDtoSchema>;
//# sourceMappingURL=job.dto.d.ts.map