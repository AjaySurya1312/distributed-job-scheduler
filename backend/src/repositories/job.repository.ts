/**
 * @file src/repositories/job.repository.ts
 * @description Data-access layer for Job and DeadLetterQueue entities.
 * Contains the performance-critical SELECT FOR UPDATE SKIP LOCKED claim query.
 */

import { Job, DeadLetterQueue, JobStatus, JobType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Job CRUD
// ---------------------------------------------------------------------------

/**
 * Creates a new job record in the database.
 */
export async function createJob(data: CreateJobInput): Promise<Job> {
  return prisma.job.create({
    data: {
      queueId: data.queueId,
      name: data.name,
      type: data.type,
      payload: data.payload as Prisma.InputJsonValue,
      priority: data.priority ?? 3,
      runAt: data.runAt,
      cronExpression: data.cronExpression,
      cronTimezone: data.cronTimezone,
      maxAttempts: data.maxAttempts ?? 3,
      jobTimeoutMs: data.jobTimeoutMs,
      idempotencyKey: data.idempotencyKey,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
      batchId: data.batchId,
      status: data.status ?? JobStatus.PENDING,
    },
  });
}

/**
 * Finds a job by its primary ID, including its executions.
 */
export async function findJobById(id: string): Promise<(Job & { executions: import('@prisma/client').Execution[] }) | null> {
  return prisma.job.findUnique({
    where: { id },
    include: { executions: { orderBy: { createdAt: 'desc' } } },
  });
}

/**
 * Paginated job listing for a queue with optional status/type/search filters.
 */
export async function findJobsByQueue(
  queueId: string,
  filters: JobFilters,
  pagination: JobPagination,
): Promise<{ jobs: Job[]; total: number }> {
  const where: Prisma.JobWhereInput = {
    queueId,
    ...(filters.status && { status: filters.status }),
    ...(filters.type && { type: filters.type }),
    ...(filters.search && {
      name: { contains: filters.search, mode: 'insensitive' },
    }),
  };

  const [jobs, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total };
}

/**
 * Updates a job status and optional extra fields atomically.
 */
export async function updateJobStatus(
  id: string,
  status: JobStatus,
  extra?: Partial<Prisma.JobUpdateInput>,
): Promise<Job> {
  return prisma.job.update({
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
export async function claimJob(queueId: string, workerId: string): Promise<Job | null> {
  type RawJobRow = {
    id: string;
    queue_id: string;
    worker_id: string | null;
    type: JobType;
    status: JobStatus;
    name: string;
    payload: unknown;
    priority: number;
    attempts: number;
    max_attempts: number;
    run_at: Date | null;
    scheduled_at: Date | null;
    cron_expression: string | null;
    cron_timezone: string | null;
    job_timeout_ms: number | null;
    idempotency_key: string | null;
    parent_job_id: string | null;
    batch_id: string | null;
    claimed_at: Date | null;
    completed_at: Date | null;
    next_retry_at: Date | null;
    result: unknown;
    error_message: string | null;
    error_stack: string | null;
    metadata: unknown;
    created_at: Date;
    updated_at: Date;
  };

  const result = await prisma.$transaction(async (tx) => {
    // SELECT FOR UPDATE SKIP LOCKED — the key to race-free job claiming
    const jobs = await tx.$queryRaw<RawJobRow[]>`
      SELECT * FROM jobs
      WHERE queue_id = ${queueId}::uuid
        AND status = 'QUEUED'::"JobStatus"
        AND (run_at IS NULL OR run_at <= NOW())
      ORDER BY priority ASC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (jobs.length === 0) return null;

    const job = jobs[0];

    // Atomically mark the job as RUNNING and bind to this worker
    const updated = await tx.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.RUNNING,
        workerId,
        claimedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    return updated;
  });

  if (result) {
    logger.debug('Job claimed by worker', { jobId: result.id, workerId });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Job lifecycle transitions
// ---------------------------------------------------------------------------

/**
 * Increments the attempt counter on a job.
 */
export async function incrementJobAttempts(id: string): Promise<Job> {
  return prisma.job.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
}

/**
 * Marks a job as COMPLETED with an optional result payload.
 */
export async function markJobCompleted(id: string, result?: unknown): Promise<Job> {
  return prisma.job.update({
    where: { id },
    data: {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      workerId: null,
      result: result as Prisma.InputJsonValue | undefined,
      errorMessage: null,
      errorStack: null,
    },
  });
}

/**
 * Marks a job as FAILED (or RETRYING if nextRetryAt is provided).
 */
export async function markJobFailed(
  id: string,
  error: { message: string; stack?: string },
  nextRetryAt?: Date,
): Promise<Job> {
  const status = nextRetryAt ? JobStatus.RETRYING : JobStatus.FAILED;
  return prisma.job.update({
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
export async function moveToDeadLetter(
  jobId: string,
  queueId: string,
  reason: string,
  payload: unknown,
  totalAttempts: number,
  errorStack?: string,
): Promise<DeadLetterQueue> {
  return prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: jobId },
      data: { status: JobStatus.DEAD, workerId: null },
    });

    const dlq = await tx.deadLetterQueue.upsert({
      where: { jobId },
      create: {
        jobId,
        queueId,
        failureReason: reason,
        lastErrorStack: errorStack,
        payloadSnapshot: payload as Prisma.InputJsonValue,
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

    logger.warn('Job moved to dead letter queue', { jobId, queueId, reason });
    return dlq;
  });
}

// ---------------------------------------------------------------------------
// Dead Letter Queue
// ---------------------------------------------------------------------------

/**
 * Paginated listing of dead letter queue entries for a specific queue.
 */
export async function listDeadLetterQueue(
  queueId: string,
  page: number,
  pageSize: number,
): Promise<{ entries: (DeadLetterQueue & { job: Job })[]; total: number }> {
  const where: Prisma.DeadLetterQueueWhereInput = { queueId, isResolved: false };
  const [entries, total] = await prisma.$transaction([
    prisma.deadLetterQueue.findMany({
      where,
      include: { job: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.deadLetterQueue.count({ where }),
  ]);
  return { entries, total };
}

/**
 * Re-queues a job from the DLQ back to QUEUED status.
 * Marks the DLQ entry as resolved.
 */
export async function retryDeadLetterJob(jobId: string, userId: string): Promise<Job> {
  return prisma.$transaction(async (tx) => {
    const dlqEntry = await tx.deadLetterQueue.findUnique({ where: { jobId } });
    if (!dlqEntry) throw new Error(`DLQ entry not found for job ${jobId}`);

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
        status: JobStatus.QUEUED,
        attempts: 0,
        errorMessage: null,
        errorStack: null,
        nextRetryAt: null,
      },
    });

    logger.info('Dead letter job retried', { jobId, userId });
    return job;
  });
}

/**
 * Cancels a job (must be PENDING or QUEUED).
 */
export async function cancelJob(id: string): Promise<Job> {
  return prisma.job.update({
    where: { id },
    data: {
      status: JobStatus.CANCELLED,
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
export async function getJobStats(queueId: string): Promise<JobStats> {
  const stats = await prisma.job.groupBy({
    by: ['status'],
    where: { queueId },
    _count: { status: true },
  });

  const result: JobStats = {
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
    const key = s.status.toLowerCase() as keyof JobStats;
    result[key] = s._count.status;
  }

  return result;
}
