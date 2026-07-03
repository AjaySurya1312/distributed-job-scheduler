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
import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';
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
export declare function createProcessor(queueName: string, workerId: string, prismaClient: PrismaClient, redisPublisher: Redis, onJobStart?: () => void, onJobEnd?: () => void): Worker;
//# sourceMappingURL=job.processor.d.ts.map