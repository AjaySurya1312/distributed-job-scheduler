/**
 * @file src/repositories/job.repository.ts
 * @description Data-access layer for Job and DeadLetterQueue entities.
 * Contains the performance-critical SELECT FOR UPDATE SKIP LOCKED claim query.
 */
import { Job, DeadLetterQueue, JobStatus, JobType, Prisma } from '@prisma/client';
export type CreateJobInput = {
    queueId: string;
    name: string;
    type: JobType;
    payload: Record<string, unknown>;
    priority?: number;
    runAt?: Date;
    cronExpression?: string;
    cronTimezone?: string;
    maxAttempts?: number;
    jobTimeoutMs?: number;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
    batchId?: string;
    status?: JobStatus;
};
export type JobFilters = {
    status?: JobStatus;
    type?: JobType;
    search?: string;
};
export type JobPagination = {
    page: number;
    pageSize: number;
    sortBy: 'createdAt' | 'priority' | 'status';
    sortOrder: 'asc' | 'desc';
};
export type JobStats = {
    pending: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    dead: number;
    retrying: number;
    cancelled: number;
};
/**
 * Creates a new job record in the database.
 */
export declare function createJob(data: CreateJobInput): Promise<Job>;
/**
 * Finds a job by its primary ID, including its executions.
 */
export declare function findJobById(id: string): Promise<(Job & {
    executions: import('@prisma/client').Execution[];
}) | null>;
/**
 * Paginated job listing for a queue with optional status/type/search filters.
 */
export declare function findJobsByQueue(queueId: string, filters: JobFilters, pagination: JobPagination): Promise<{
    jobs: Job[];
    total: number;
}>;
/**
 * Updates a job status and optional extra fields atomically.
 */
export declare function updateJobStatus(id: string, status: JobStatus, extra?: Partial<Prisma.JobUpdateInput>): Promise<Job>;
/**
 * Atomically claims the highest-priority QUEUED job in a queue for a worker.
 * Uses PostgreSQL's SELECT FOR UPDATE SKIP LOCKED to prevent race conditions
 * between multiple worker instances competing for the same jobs.
 *
 * @returns The claimed job, or null if no jobs are available.
 */
export declare function claimJob(queueId: string, workerId: string): Promise<Job | null>;
/**
 * Increments the attempt counter on a job.
 */
export declare function incrementJobAttempts(id: string): Promise<Job>;
/**
 * Marks a job as COMPLETED with an optional result payload.
 */
export declare function markJobCompleted(id: string, result?: unknown): Promise<Job>;
/**
 * Marks a job as FAILED (or RETRYING if nextRetryAt is provided).
 */
export declare function markJobFailed(id: string, error: {
    message: string;
    stack?: string;
}, nextRetryAt?: Date): Promise<Job>;
/**
 * Moves a failed job to the DeadLetterQueue and marks it as DEAD.
 */
export declare function moveToDeadLetter(jobId: string, queueId: string, reason: string, payload: unknown, totalAttempts: number, errorStack?: string): Promise<DeadLetterQueue>;
/**
 * Paginated listing of dead letter queue entries for a specific queue.
 */
export declare function listDeadLetterQueue(queueId: string, page: number, pageSize: number): Promise<{
    entries: (DeadLetterQueue & {
        job: Job;
    })[];
    total: number;
}>;
/**
 * Re-queues a job from the DLQ back to QUEUED status.
 * Marks the DLQ entry as resolved.
 */
export declare function retryDeadLetterJob(jobId: string, userId: string): Promise<Job>;
/**
 * Cancels a job (must be PENDING or QUEUED).
 */
export declare function cancelJob(id: string): Promise<Job>;
/**
 * Returns aggregate job counts per status for a queue.
 */
export declare function getJobStats(queueId: string): Promise<JobStats>;
//# sourceMappingURL=job.repository.d.ts.map