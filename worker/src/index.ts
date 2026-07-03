/**
 * @file index.ts
 * @description Worker Service Entry Point
 *
 * Orchestrates every worker component in the correct startup order and
 * implements a production-grade graceful shutdown flow.
 *
 * Startup sequence:
 *  1. Validate environment variables (env.ts, exits if invalid)
 *  2. Connect to Redis and Prisma
 *  3. Register this worker instance in the `Worker` DB table
 *  4. For each configured queue: create a BullMQ Worker (job.processor.ts)
 *  5. Start HeartbeatService (keeps the worker visible to the API + LeaseManager)
 *  6. Optionally start LeaseManagerService (ENABLE_LEASE_MANAGER=true)
 *  7. Optionally start SchedulerService (ENABLE_SCHEDULER=true)
 *  8. Wire job-count tracking across all processors
 *
 * Graceful shutdown (SIGTERM / SIGINT):
 *  a. Set a global "draining" flag — the processor won't accept new BullMQ jobs
 *  b. Call worker.close() on every BullMQ Worker (waits for in-flight jobs, max 30 s)
 *  c. Stop HeartbeatService (marks worker STOPPED in Redis + PG)
 *  d. Stop LeaseManagerService and SchedulerService if running
 *  e. Update Worker row in PostgreSQL: status=STOPPED, stoppedAt=now
 *  f. Close Redis connections and Prisma
 *  g. process.exit(0)
 *
 * If shutdown takes longer than 35 seconds, process.exit(1) is forced.
 */

import 'dotenv/config';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import type { Worker as BullWorker } from 'bullmq';

// ─── Local modules (import after dotenv) ─────────────────────────────────────
import { env } from './config/env';
import { logger } from './config/logger';
import { redis, publisherRedis, closeRedisConnections } from './config/redis';
import { prisma, closePrismaConnection } from './config/prisma';
import { createProcessor } from './processors/job.processor';
import { HeartbeatService } from './services/heartbeat.service';
import { LeaseManagerService } from './services/lease-manager.service';
import { SchedulerService } from './services/scheduler.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKER_ID = uuidv4();
const HOSTNAME = os.hostname();
const PID = process.pid;
/** Maximum time to wait for in-flight jobs to finish during shutdown. */
const SHUTDOWN_GRACE_PERIOD_MS = 30_000;
/** Hard kill timeout — force exit if graceful shutdown takes too long. */
const SHUTDOWN_FORCE_KILL_MS = 35_000;

// ─── Shared State ─────────────────────────────────────────────────────────────

/** Running count of jobs actively being processed across all queues. */
let activeJobCount = 0;

/** Set to true when a shutdown signal has been received. */
let isShuttingDown = false;

// ─── Registered Components (for lifecycle management) ─────────────────────────
let heartbeatService: HeartbeatService | null = null;
let leaseManagerService: LeaseManagerService | null = null;
let schedulerService: SchedulerService | null = null;
const bullWorkers: BullWorker[] = [];

// ─── Publish Helper ───────────────────────────────────────────────────────────

/**
 * Publishes a message to a Redis Pub/Sub channel.
 * Errors are swallowed — pub/sub is best-effort for real-time dashboards.
 */
async function publish(channel: string, message: string): Promise<void> {
  try {
    await publisherRedis.publish(channel, message);
  } catch (err) {
    logger.warn('Failed to publish Redis event', { channel, error: err });
  }
}

// ─── Worker Registration ──────────────────────────────────────────────────────

/**
 * Inserts a Worker row in PostgreSQL to register this instance.
 * Uses upsert so a restarted worker (same workerId) simply updates its row.
 */
async function registerWorker(queueNames: string[]): Promise<void> {
  await prisma.worker.upsert({
    where: { id: WORKER_ID },
    create: {
      id: WORKER_ID,
      hostname: HOSTNAME,
      pid: PID,
      status: 'IDLE',
      queues: queueNames,
      startedAt: new Date(),
      lastHeartbeatAt: new Date(),
    },
    update: {
      hostname: HOSTNAME,
      pid: PID,
      status: 'IDLE',
      queues: queueNames,
      startedAt: new Date(),
      lastHeartbeatAt: new Date(),
      stoppedAt: null,
      diedAt: null,
    },
  });

  logger.info('Worker registered in database', {
    workerId: WORKER_ID,
    hostname: HOSTNAME,
    pid: PID,
    queues: queueNames,
  });
}

// ─── Active Job Tracking ──────────────────────────────────────────────────────

/** Called by each processor when a job starts executing. */
function onJobStart(): void {
  activeJobCount++;
  heartbeatService?.updateActiveJobs(activeJobCount);

  if (activeJobCount === 1) {
    // Transition worker status from IDLE → ACTIVE on first job
    prisma.worker
      .updateMany({ where: { id: WORKER_ID }, data: { status: 'ACTIVE' } })
      .catch((err) => logger.warn('Failed to set worker ACTIVE', { error: err }));
  }
}

/** Called by each processor when a job completes or fails. */
function onJobEnd(): void {
  activeJobCount = Math.max(0, activeJobCount - 1);
  heartbeatService?.updateActiveJobs(activeJobCount);

  if (activeJobCount === 0) {
    // Transition back to IDLE when no jobs are running
    prisma.worker
      .updateMany({ where: { id: WORKER_ID }, data: { status: 'IDLE' } })
      .catch((err) => logger.warn('Failed to set worker IDLE', { error: err }));
  }
}

// ─── BullMQ Worker Setup ──────────────────────────────────────────────────────

/**
 * Creates a BullMQ Worker for each configured queue and wires up event
 * handlers for active-job counting and drain-state enforcement.
 */
function startProcessors(queueNames: string[]): void {
  for (const queueName of queueNames) {
    logger.info(`Starting processor for queue: "${queueName}"`);

    const worker = createProcessor(
      queueName,
      WORKER_ID,
      prisma,
      publisherRedis,
      onJobStart,
      onJobEnd,
    );

    // If we're already in drain mode (e.g. signal arrived before startup finished),
    // immediately pause the newly created worker.
    if (isShuttingDown) {
      void worker.pause();
    }

    bullWorkers.push(worker);

    logger.info(`Processor ready for queue: "${queueName}"`, {
      concurrency: env.WORKER_CONCURRENCY,
    });
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

/**
 * Coordinates a clean shutdown of every component in the correct order.
 * The force-kill timer ensures we never hang indefinitely.
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress — ignoring duplicate signal ${signal}`);
    return;
  }

  isShuttingDown = true;

  logger.info(`Received ${signal} — initiating graceful shutdown`, {
    workerId: WORKER_ID,
    activeJobs: activeJobCount,
  });

  // ── Force-kill safety net ──────────────────────────────────────────────────
  const forceKillTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing process exit', {
      workerId: WORKER_ID,
    });
    process.exit(1);
  }, SHUTDOWN_FORCE_KILL_MS);

  // Allow the force-kill timer to be garbage-collected if shutdown succeeds
  forceKillTimer.unref?.();

  try {
    // ── Step a: Stop accepting new jobs ─────────────────────────────────────
    logger.info('Pausing all BullMQ Workers (draining)…');
    await Promise.allSettled(bullWorkers.map((w) => w.pause()));

    // ── Step b: Wait for in-flight jobs (max SHUTDOWN_GRACE_PERIOD_MS) ──────
    if (activeJobCount > 0) {
      logger.info(`Waiting for ${activeJobCount} active job(s) to finish…`, {
        timeoutMs: SHUTDOWN_GRACE_PERIOD_MS,
      });

      const drainStart = Date.now();

      await Promise.race([
        // Close each worker — BullMQ will wait for in-progress jobs internally
        Promise.all(bullWorkers.map((w) => w.close())),
        new Promise<void>((resolve) =>
          setTimeout(() => {
            logger.warn('Grace period expired — forcing BullMQ close', {
              remainingJobs: activeJobCount,
            });
            resolve();
          }, SHUTDOWN_GRACE_PERIOD_MS),
        ),
      ]);

      logger.info('BullMQ Workers drained', {
        durationMs: Date.now() - drainStart,
      });
    } else {
      // No active jobs — close immediately
      await Promise.allSettled(bullWorkers.map((w) => w.close()));
      logger.info('BullMQ Workers closed (no active jobs)');
    }

    // ── Step c: Stop HeartbeatService ────────────────────────────────────────
    if (heartbeatService) {
      await heartbeatService.stop();
    }

    // ── Step d: Stop optional services ───────────────────────────────────────
    leaseManagerService?.stop();
    schedulerService?.stop();

    // ── Step e: Mark worker STOPPED in PostgreSQL ─────────────────────────────
    try {
      await prisma.worker.updateMany({
        where: { id: WORKER_ID },
        data: { status: 'STOPPED', stoppedAt: new Date() },
      });
      logger.info('Worker marked STOPPED in database');
    } catch (err) {
      logger.warn('Failed to mark worker STOPPED in database', { error: err });
    }

    // ── Step f: Publish worker-stopped event ─────────────────────────────────
    await publish(
      'worker-events',
      JSON.stringify({
        type: 'WORKER_STOPPED',
        workerId: WORKER_ID,
        signal,
        timestamp: new Date().toISOString(),
      }),
    );

    // ── Step g: Close infrastructure connections ──────────────────────────────
    await closeRedisConnections();
    await closePrismaConnection();

    clearTimeout(forceKillTimer);

    logger.info('Graceful shutdown complete', { workerId: WORKER_ID });
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown', { error: err });
    process.exit(1);
  }
}

// ─── Unhandled Error Handlers ─────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — initiating shutdown', {
    workerId: WORKER_ID,
    error: err,
  });
  void gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection — initiating shutdown', {
    workerId: WORKER_ID,
    reason,
  });
  void gracefulShutdown('unhandledRejection');
});

// ─── Signal Handlers ──────────────────────────────────────────────────────────

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

// ─── Bootstrap ────────────────────────────────────────────────────────────────

/**
 * Main entry point. Starts all worker components in dependency order.
 */
async function bootstrap(): Promise<void> {
  logger.info('═══════════════════════════════════════════════');
  logger.info('  @job-scheduler/worker  starting up');
  logger.info('═══════════════════════════════════════════════');
  logger.info('Worker configuration', {
    workerId: WORKER_ID,
    hostname: HOSTNAME,
    pid: PID,
    queues: env.WORKER_QUEUES,
    concurrency: env.WORKER_CONCURRENCY,
    heartbeatIntervalMs: env.HEARTBEAT_INTERVAL_MS,
    leaseCheckIntervalMs: env.LEASE_CHECK_INTERVAL_MS,
    staleThresholdMs: env.WORKER_STALE_THRESHOLD_MS,
    leaseManagerEnabled: env.ENABLE_LEASE_MANAGER,
    schedulerEnabled: env.ENABLE_SCHEDULER,
    nodeEnv: env.NODE_ENV,
  });

  // ── 1. Verify Redis connectivity ───────────────────────────────────────────
  try {
    await redis.ping();
    logger.info('Redis connectivity verified');
  } catch (err) {
    logger.error('Redis connectivity check failed — aborting', { error: err });
    process.exit(1);
  }

  // ── 2. Verify Prisma / PostgreSQL connectivity ─────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('PostgreSQL connectivity verified');
  } catch (err) {
    logger.error('PostgreSQL connectivity check failed — aborting', { error: err });
    process.exit(1);
  }

  // ── 3. Register worker in database ────────────────────────────────────────
  try {
    await registerWorker(env.WORKER_QUEUES);
  } catch (err) {
    logger.error('Worker registration failed — aborting', { error: err });
    process.exit(1);
  }

  // ── 4. Start BullMQ Processors ────────────────────────────────────────────
  startProcessors(env.WORKER_QUEUES);

  // ── 5. Start HeartbeatService ─────────────────────────────────────────────
  heartbeatService = new HeartbeatService(
    WORKER_ID,
    env.WORKER_QUEUES.join(','),
    redis,
    prisma,
  );
  heartbeatService.start();

  // ── 6. Optionally start LeaseManagerService ────────────────────────────────
  if (env.ENABLE_LEASE_MANAGER) {
    logger.info('Lease Manager enabled on this instance');
    leaseManagerService = new LeaseManagerService(redis, prisma, publish);
    leaseManagerService.start();
  } else {
    logger.info('Lease Manager disabled on this instance (ENABLE_LEASE_MANAGER=false)');
  }

  // ── 7. Optionally start SchedulerService ─────────────────────────────────
  if (env.ENABLE_SCHEDULER) {
    logger.info('Scheduler enabled on this instance');
    schedulerService = new SchedulerService(redis, prisma);
    schedulerService.start();
  } else {
    logger.info('Scheduler disabled on this instance (ENABLE_SCHEDULER=false)');
  }

  // ── 8. Publish worker-started event ───────────────────────────────────────
  await publish(
    'worker-events',
    JSON.stringify({
      type: 'WORKER_STARTED',
      workerId: WORKER_ID,
      hostname: HOSTNAME,
      pid: PID,
      queues: env.WORKER_QUEUES,
      timestamp: new Date().toISOString(),
    }),
  );

  logger.info('Worker fully initialised — listening for jobs', {
    workerId: WORKER_ID,
    queues: env.WORKER_QUEUES,
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

bootstrap().catch((err: unknown) => {
  logger.error('Bootstrap failed — exiting', { error: err });
  process.exit(1);
});
