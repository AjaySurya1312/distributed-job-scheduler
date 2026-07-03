"use strict";
/**
 * @file src/repositories/job.repository.ts
 * @description Data-access layer for Job and DeadLetterQueue entities.
 * Contains the performance-critical SELECT FOR UPDATE SKIP LOCKED claim query.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = createJob;
exports.findJobById = findJobById;
exports.findJobsByQueue = findJobsByQueue;
exports.updateJobStatus = updateJobStatus;
exports.claimJob = claimJob;
exports.incrementJobAttempts = incrementJobAttempts;
exports.markJobCompleted = markJobCompleted;
exports.markJobFailed = markJobFailed;
exports.moveToDeadLetter = moveToDeadLetter;
exports.listDeadLetterQueue = listDeadLetterQueue;
exports.retryDeadLetterJob = retryDeadLetterJob;
exports.cancelJob = cancelJob;
exports.getJobStats = getJobStats;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
// ---------------------------------------------------------------------------
// Job CRUD
// ---------------------------------------------------------------------------
/**
 * Creates a new job record in the database.
 */
async function createJob(data) {
    return prisma_1.prisma.job.create({
        data: {
            queueId: data.queueId,
            name: data.name,
            type: data.type,
            payload: data.payload,
            priority: data.priority ?? 3,
            runAt: data.runAt,
            cronExpression: data.cronExpression,
            cronTimezone: data.cronTimezone,
            maxAttempts: data.maxAttempts ?? 3,
            jobTimeoutMs: data.jobTimeoutMs,
            idempotencyKey: data.idempotencyKey,
            metadata: data.metadata,
            batchId: data.batchId,
            status: data.status ?? client_1.JobStatus.PENDING,
        },
    });
}
/**
 * Finds a job by its primary ID, including its executions.
 */
async function findJobById(id) {
    return prisma_1.prisma.job.findUnique({
        where: { id },
        include: { executions: { orderBy: { createdAt: 'desc' } } },
    });
}
/**
 * Paginated job listing for a queue with optional status/type/search filters.
 */
async function findJobsByQueue(queueId, filters, pagination) {
    const where = {
        queueId,
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.search && {
            name: { contains: filters.search, mode: 'insensitive' },
        }),
    };
    const [jobs, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.job.findMany({
            where,
            orderBy: { [pagination.sortBy]: pagination.sortOrder },
            skip: (pagination.page - 1) * pagination.pageSize,
            take: pagination.pageSize,
        }),
        prisma_1.prisma.job.count({ where }),
    ]);
    return { jobs, total };
}
/**
 * Updates a job status and optional extra fields atomically.
 */
async function updateJobStatus(id, status, extra) {
    return prisma_1.prisma.job.update({
        where: { id },
        data: { status, ...extra },
    });
}
// ---------------------------------------------------------------------------
// Worker job claiming (SELECT FOR UPDATE SKIP LOCKED)
// ---------------------------------------------------------------------------
/**
 * Atomically claims the highest-priority QUEUED job in a queue for a worker.
 * Uses PostgreSQL's SELECT FOR UPDATE SKIP LOCKED to prevent race conditions
 * between multiple worker instances competing for the same jobs.
 *
 * @returns The claimed job, or null if no jobs are available.
 */
async function claimJob(queueId, workerId) {
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        // SELECT FOR UPDATE SKIP LOCKED � the key to race-free job claiming
        const jobs = await tx.$queryRaw `
      SELECT * FROM jobs
      WHERE queue_id = ${queueId}::uuid
        AND status = 'QUEUED'::"JobStatus"
        AND (run_at IS NULL OR run_at <= NOW())
      ORDER BY priority ASC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;
        if (jobs.length === 0)
            return null;
        const job = jobs[0];
        // Atomically mark the job as RUNNING and bind to this worker
        const updated = await tx.job.update({
            where: { id: job.id },
            data: {
                status: client_1.JobStatus.RUNNING,
                workerId,
                claimedAt: new Date(),
                attempts: { increment: 1 },
            },
        });
        return updated;
    });
    if (result) {
        logger_1.logger.debug('Job claimed by worker', { jobId: result.id, workerId });
    }
    return result;
}
// ---------------------------------------------------------------------------
// Job lifecycle transitions
// ---------------------------------------------------------------------------
/**
 * Increments the attempt counter on a job.
 */
async function incrementJobAttempts(id) {
    return prisma_1.prisma.job.update({
        where: { id },
        data: { attempts: { increment: 1 } },
    });
}
/**
 * Marks a job as COMPLETED with an optional result payload.
 */
async function markJobCompleted(id, result) {
    return prisma_1.prisma.job.update({
        where: { id },
        data: {
            status: client_1.JobStatus.COMPLETED,
            completedAt: new Date(),
            workerId: null,
            result: result,
            errorMessage: null,
            errorStack: null,
        },
    });
}
/**
 * Marks a job as FAILED (or RETRYING if nextRetryAt is provided).
 */
async function markJobFailed(id, error, nextRetryAt) {
    const status = nextRetryAt ? client_1.JobStatus.RETRYING : client_1.JobStatus.FAILED;
    return prisma_1.prisma.job.update({
        where: { id },
        data: {
            status,
            workerId: null,
            errorMessage: error.message,
            errorStack: error.stack,
            nextRetryAt,
        },
    });
}
/**
 * Moves a failed job to the DeadLetterQueue and marks it as DEAD.
 */
async function moveToDeadLetter(jobId, queueId, reason, payload, totalAttempts, errorStack) {
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.job.update({
            where: { id: jobId },
            data: { status: client_1.JobStatus.DEAD, workerId: null },
        });
        const dlq = await tx.deadLetterQueue.upsert({
            where: { jobId },
            create: {
                jobId,
                queueId,
                failureReason: reason,
                lastErrorStack: errorStack,
                payloadSnapshot: payload,
                totalAttempts,
                isResolved: false,
            },
            update: {
                failureReason: reason,
                lastErrorStack: errorStack,
                totalAttempts,
                isResolved: false,
                resolvedAt: null,
                resolvedBy: null,
            },
        });
        logger_1.logger.warn('Job moved to dead letter queue', { jobId, queueId, reason });
        return dlq;
    });
}
// ---------------------------------------------------------------------------
// Dead Letter Queue
// ---------------------------------------------------------------------------
/**
 * Paginated listing of dead letter queue entries for a specific queue.
 */
async function listDeadLetterQueue(queueId, page, pageSize) {
    const where = { queueId, isResolved: false };
    const [entries, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.deadLetterQueue.findMany({
            where,
            include: { job: true },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma_1.prisma.deadLetterQueue.count({ where }),
    ]);
    return { entries, total };
}
/**
 * Re-queues a job from the DLQ back to QUEUED status.
 * Marks the DLQ entry as resolved.
 */
async function retryDeadLetterJob(jobId, userId) {
    return prisma_1.prisma.$transaction(async (tx) => {
        const dlqEntry = await tx.deadLetterQueue.findUnique({ where: { jobId } });
        if (!dlqEntry)
            throw new Error(`DLQ entry not found for job ${jobId}`);
        await tx.deadLetterQueue.update({
            where: { jobId },
            data: {
                isResolved: true,
                resolvedAt: new Date(),
                resolvedBy: userId,
                resolution: 'RETRIED',
            },
        });
        const job = await tx.job.update({
            where: { id: jobId },
            data: {
                status: client_1.JobStatus.QUEUED,
                attempts: 0,
                errorMessage: null,
                errorStack: null,
                nextRetryAt: null,
            },
        });
        logger_1.logger.info('Dead letter job retried', { jobId, userId });
        return job;
    });
}
/**
 * Cancels a job (must be PENDING or QUEUED).
 */
async function cancelJob(id) {
    return prisma_1.prisma.job.update({
        where: { id },
        data: {
            status: client_1.JobStatus.CANCELLED,
            workerId: null,
        },
    });
}
// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
/**
 * Returns aggregate job counts per status for a queue.
 */
async function getJobStats(queueId) {
    const stats = await prisma_1.prisma.job.groupBy({
        by: ['status'],
        where: { queueId },
        _count: { status: true },
    });
    const result = {
        pending: 0,
        queued: 0,
        running: 0,
        completed: 0,
        failed: 0,
        dead: 0,
        retrying: 0,
        cancelled: 0,
    };
    for (const s of stats) {
        const key = s.status.toLowerCase();
        result[key] = s._count.status;
    }
    return result;
}
//# sourceMappingURL=job.repository.js.map