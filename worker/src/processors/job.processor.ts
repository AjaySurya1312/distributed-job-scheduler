/**
 * @file job.processor.ts
 * @description Core BullMQ job processor for the Worker Service.
 *
 * Responsibilities:
 * 1. Claim jobs atomically from Redis via BullMQ Worker
 * 2. Create an Execution record in PostgreSQL on STARTED
 * 3. Wrap job execution in Promise.race with a per-job timeout
 * 4. Simulate job work based on job type (email, payment, report, notification)
 * 5. Update Job + Execution status on success, failure, and timeout
 * 6. Log all execution events with bound contextual metadata
 * 7. Publish real-time status updates to the 'job-events' Redis channel
 *
 * The BullMQ Worker produced by `createProcessor` is fully autonomous;
 * all state management happens inside the processor function closure.
 */

import { Worker, Job as BullJob, UnrecoverableError } from 'bullmq';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../config/logger';
import { env } from '../config/env';
import { createBullMQRedisClient } from '../config/redis';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Shape of the data payload stored inside each BullMQ job.
 * This must mirror what the API/Scheduler puts onto the queue.
 */
export interface JobPayload {
  /** Database UUID of the corresponding Job row. */
  jobId: string;
  /** Logical job type used to determine handler and simulated duration. */
  type: 'email' | 'payment' | 'report' | 'notification' | string;
  /** Arbitrary input data forwarded to the handler. */
  input: Record<string, unknown>;
  /** Caller-supplied timeout in milliseconds. Falls back to 30 000 ms. */
  timeoutMs?: number;
  /** Maximum number of retries (informational; BullMQ enforces this). */
  maxRetries?: number;
}

/**
 * Structured payload published to the 'job-events' Redis channel.
 */
export interface JobEventPayload {
  type: 'JOB_STARTED' | 'JOB_COMPLETED' | 'JOB_FAILED' | 'JOB_TIMED_OUT';
  jobId: string;
  queueName: string;
  workerId: string;
  timestamp: string;
  durationMs?: number;
  error?: string;
  result?: Record<string, unknown>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Publish a structured event to the 'job-events' Redis Pub/Sub channel.
 * Errors are swallowed so a Redis blip never crashes a running job.
 */
async function publishJobEvent(
  redisPublisher: Redis,
  payload: JobEventPayload,
): Promise<void> {
  try {
    await redisPublisher.publish('job-events', JSON.stringify(payload));
  } catch (err) {
    // Non-fatal — real-time updates are best-effort
    createChildLogger({ jobId: payload.jobId }).warn(
      'Failed to publish job event to Redis',
      { error: err },
    );
  }
}

/**
 * Returns a Promise that resolves after `ms` milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns a Promise that rejects with a timeout error after `ms` milliseconds.
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Job execution timed out after ${ms}ms`)),
      ms,
    ),
  );
}

// ─── Job Handler Simulation ──────────────────────────────────────────────────

/**
 * Simulates job work with a random sleep duration based on job type.
 * In a real system this would dispatch to actual business-logic handlers.
 *
 * @param type  - Logical job type
 * @param input - Job input payload (forwarded to handler)
 * @returns     Simulated result data
 */
async function executeJobHandler(
  type: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const durationRanges: Record<string, [number, number]> = {
    email: [500, 2000],
    payment: [1000, 3000],
    report: [2000, 5000],
    notification: [200, 500],
  };

  const [min, max] = durationRanges[type] ?? [1000, 1000];
  const simulatedDuration = Math.floor(Math.random() * (max - min + 1)) + min;

  await sleep(simulatedDuration);

  // Produce a structured result record
  return {
    processed: true,
    type,
    simulatedDurationMs: simulatedDuration,
    inputKeys: Object.keys(input),
    completedAt: new Date().toISOString(),
  };
}

// ─── Processor Factory ────────────────────────────────────────────────────────

/**
 * Creates and returns a BullMQ `Worker` that processes jobs from the specified
 * queue. Each job goes through a strict lifecycle:
 *
 *   QUEUED → RUNNING → COMPLETED | FAILED | TIMED_OUT
 *
 * @param queueName - Name of the BullMQ queue to subscribe to
 * @param workerId  - UUID identifying this worker instance
 * @param prismaClient - Shared Prisma client
 * @param redisPublisher - Dedicated Redis client for PUBLISH commands
 * @param onJobStart    - Callback invoked when a job begins (for heartbeat tracking)
 * @param onJobEnd      - Callback invoked when a job ends (for heartbeat tracking)
 */
export function createProcessor(
  queueName: string,
  workerId: string,
  prismaClient: PrismaClient,
  redisPublisher: Redis,
  onJobStart?: () => void,
  onJobEnd?: () => void,
): Worker {
  const baseLog = createChildLogger({ workerId, queueName });

  baseLog.info(`Creating BullMQ Worker for queue "${queueName}"`);

  // ── BullMQ Processor Function ──────────────────────────────────────────────
  const processorFn = async (bullJob: BullJob): Promise<Record<string, unknown>> => {
    const payload = bullJob.data as JobPayload;
    const { jobId, type, input, timeoutMs = 30_000 } = payload;

    // Build a logger pre-bound with all relevant identifiers
    const log = createChildLogger({ workerId, queueName, jobId, bullJobId: bullJob.id });

    const startedAt = new Date();
    let executionId: string | null = null;

    log.info('Job picked up from queue', { type, timeoutMs });

    // Notify the index so the heartbeat counter stays current
    onJobStart?.();

    // ── 1. Update Job status → RUNNING in PostgreSQL ─────────────────────────
    try {
      await prismaClient.job.update({
        where: { id: jobId },
        data: {
          status: 'RUNNING',
          workerId,
          claimedAt: startedAt,
        },
      });
    } catch (dbErr) {
      log.error('Failed to mark job as RUNNING in database', { error: dbErr });
      // Continue processing — we do not want a transient DB error to abort work
    }

    // ── 2. Create Execution record → STARTED ─────────────────────────────────
    try {
      const execution = await prismaClient.execution.create({
        data: {
          jobId,
          workerId,
          status: 'STARTED',
          startedAt,
          attemptNumber: (bullJob.attemptsMade ?? 0) + 1,
        },
      });
      executionId = execution.id;
      log.info('Execution record created', { executionId });
    } catch (dbErr) {
      log.error('Failed to create Execution record', { error: dbErr });
      // Non-fatal — proceed without executionId (updates below handle null)
    }

    // ── 3. Publish JOB_STARTED event ─────────────────────────────────────────
    await publishJobEvent(redisPublisher, {
      type: 'JOB_STARTED',
      jobId,
      queueName,
      workerId,
      timestamp: startedAt.toISOString(),
    });

    // ── 4. Execute with timeout ───────────────────────────────────────────────
    let result: Record<string, unknown>;
    let timedOut = false;

    try {
      result = await Promise.race([
        executeJobHandler(type, input),
        createTimeoutPromise(timeoutMs),
      ]);
    } catch (execErr) {
      const isTimeout =
        execErr instanceof Error &&
        execErr.message.includes('timed out');

      timedOut = isTimeout;
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      const errorMessage = execErr instanceof Error ? execErr.message : String(execErr);
      const errorStack = execErr instanceof Error ? execErr.stack : undefined;

      log[isTimeout ? 'warn' : 'error'](
        isTimeout ? 'Job timed out' : 'Job execution failed',
        { error: execErr, durationMs },
      );

      // ── 4a. Update Execution → TIMED_OUT | FAILED ────────────────────────
      if (executionId) {
        try {
          await prismaClient.execution.update({
            where: { id: executionId },
            data: {
              status: isTimeout ? 'TIMED_OUT' : 'FAILED',
              finishedAt,
              durationMs,
              errorMessage,
              errorStack,
            },
          });
        } catch (dbErr) {
          log.error('Failed to update Execution record on error', { error: dbErr });
        }
      }

      // ── 4b. Update Job → FAILED ───────────────────────────────────────────
      try {
        const attemptsMade = (bullJob.attemptsMade ?? 0) + 1;
        const maxRetries = (bullJob.opts.attempts ?? 1) - 1;
        const exhausted = attemptsMade > maxRetries;

        await prismaClient.job.update({
          where: { id: jobId },
          data: {
            status: exhausted ? 'FAILED' : 'QUEUED',
            completedAt: exhausted ? finishedAt : undefined,
            errorMessage: errorMessage,
            attempts: { increment: 1 },
          },
        });
      } catch (dbErr) {
        log.error('Failed to update Job status on error', { error: dbErr });
      }

      // ── 4c. Publish failure event ─────────────────────────────────────────
      await publishJobEvent(redisPublisher, {
        type: isTimeout ? 'JOB_TIMED_OUT' : 'JOB_FAILED',
        jobId,
        queueName,
        workerId,
        timestamp: finishedAt.toISOString(),
        durationMs,
        error: errorMessage,
      });

      onJobEnd?.();

      // If the job timed out and has no more retries, mark it unrecoverable
      // so BullMQ moves it straight to the dead-letter queue (failed set)
      // without further retry attempts consuming queue space.
      if (timedOut) {
        throw new UnrecoverableError(`Job ${jobId} timed out after ${timeoutMs}ms`);
      }

      // Re-throw so BullMQ records the failure and triggers its retry logic
      throw execErr;
    }

    // ── 5. Success path ───────────────────────────────────────────────────────
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    log.info('Job completed successfully', { durationMs });

    // ── 5a. Update Execution → COMPLETED ──────────────────────────────────
    if (executionId) {
      try {
        await prismaClient.execution.update({
          where: { id: executionId },
          data: {
            status: 'COMPLETED',
            finishedAt,
            durationMs,
          },
        });
      } catch (dbErr) {
        log.error('Failed to update Execution record on success', { error: dbErr });
      }
    }

    // ── 5b. Update Job → COMPLETED ────────────────────────────────────────
    try {
      await prismaClient.job.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: finishedAt,
          result: result as any,
        },
      });
    } catch (dbErr) {
      log.error('Failed to update Job status on success', { error: dbErr });
    }

    // ── 5c. Publish success event ─────────────────────────────────────────
    await publishJobEvent(redisPublisher, {
      type: 'JOB_COMPLETED',
      jobId,
      queueName,
      workerId,
      timestamp: finishedAt.toISOString(),
      durationMs,
      result,
    });

    onJobEnd?.();

    return result;
  };

  // ── Instantiate BullMQ Worker ──────────────────────────────────────────────
  const worker = new Worker(queueName, processorFn, {
    connection: createBullMQRedisClient() as any,
    concurrency: env.WORKER_CONCURRENCY,
    // Remove jobs from the completed set after 1 hour to keep Redis lean
    removeOnComplete: { age: 3600, count: 1000 },
    // Keep the last 500 failed jobs for post-mortem analysis
    removeOnFail: { count: 500 },
  });

  // ── Worker-level event handlers ────────────────────────────────────────────
  worker.on('error', (err) => {
    baseLog.error('BullMQ Worker error', { error: err });
  });

  worker.on('stalled', (jobId) => {
    baseLog.warn('Job stalled — will be re-queued by BullMQ', { bullJobId: jobId });
  });

  worker.on('failed', (bullJob, err) => {
    baseLog.error('BullMQ job failed (after all retries)', {
      bullJobId: bullJob?.id,
      jobId: (bullJob?.data as JobPayload | undefined)?.jobId,
      error: err.message,
    });
  });

  baseLog.info(`BullMQ Worker started for queue "${queueName}"`, {
    concurrency: env.WORKER_CONCURRENCY,
  });

  return worker;
}
