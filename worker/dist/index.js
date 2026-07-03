"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const os = __importStar(require("os"));
const uuid_1 = require("uuid");
// ─── Local modules (import after dotenv) ─────────────────────────────────────
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const redis_1 = require("./config/redis");
const prisma_1 = require("./config/prisma");
const job_processor_1 = require("./processors/job.processor");
const heartbeat_service_1 = require("./services/heartbeat.service");
const lease_manager_service_1 = require("./services/lease-manager.service");
const scheduler_service_1 = require("./services/scheduler.service");
// ─── Constants ────────────────────────────────────────────────────────────────
const WORKER_ID = (0, uuid_1.v4)();
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
let heartbeatService = null;
let leaseManagerService = null;
let schedulerService = null;
const bullWorkers = [];
// ─── Publish Helper ───────────────────────────────────────────────────────────
/**
 * Publishes a message to a Redis Pub/Sub channel.
 * Errors are swallowed — pub/sub is best-effort for real-time dashboards.
 */
async function publish(channel, message) {
    try {
        await redis_1.publisherRedis.publish(channel, message);
    }
    catch (err) {
        logger_1.logger.warn('Failed to publish Redis event', { channel, error: err });
    }
}
// ─── Worker Registration ──────────────────────────────────────────────────────
/**
 * Inserts a Worker row in PostgreSQL to register this instance.
 * Uses upsert so a restarted worker (same workerId) simply updates its row.
 */
async function registerWorker(queueNames) {
    await prisma_1.prisma.worker.upsert({
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
    logger_1.logger.info('Worker registered in database', {
        workerId: WORKER_ID,
        hostname: HOSTNAME,
        pid: PID,
        queues: queueNames,
    });
}
// ─── Active Job Tracking ──────────────────────────────────────────────────────
/** Called by each processor when a job starts executing. */
function onJobStart() {
    activeJobCount++;
    heartbeatService?.updateActiveJobs(activeJobCount);
    if (activeJobCount === 1) {
        // Transition worker status from IDLE → ACTIVE on first job
        prisma_1.prisma.worker
            .updateMany({ where: { id: WORKER_ID }, data: { status: 'ACTIVE' } })
            .catch((err) => logger_1.logger.warn('Failed to set worker ACTIVE', { error: err }));
    }
}
/** Called by each processor when a job completes or fails. */
function onJobEnd() {
    activeJobCount = Math.max(0, activeJobCount - 1);
    heartbeatService?.updateActiveJobs(activeJobCount);
    if (activeJobCount === 0) {
        // Transition back to IDLE when no jobs are running
        prisma_1.prisma.worker
            .updateMany({ where: { id: WORKER_ID }, data: { status: 'IDLE' } })
            .catch((err) => logger_1.logger.warn('Failed to set worker IDLE', { error: err }));
    }
}
// ─── BullMQ Worker Setup ──────────────────────────────────────────────────────
/**
 * Creates a BullMQ Worker for each configured queue and wires up event
 * handlers for active-job counting and drain-state enforcement.
 */
function startProcessors(queueNames) {
    for (const queueName of queueNames) {
        logger_1.logger.info(`Starting processor for queue: "${queueName}"`);
        const worker = (0, job_processor_1.createProcessor)(queueName, WORKER_ID, prisma_1.prisma, redis_1.publisherRedis, onJobStart, onJobEnd);
        // If we're already in drain mode (e.g. signal arrived before startup finished),
        // immediately pause the newly created worker.
        if (isShuttingDown) {
            void worker.pause();
        }
        bullWorkers.push(worker);
        logger_1.logger.info(`Processor ready for queue: "${queueName}"`, {
            concurrency: env_1.env.WORKER_CONCURRENCY,
        });
    }
}
// ─── Graceful Shutdown ────────────────────────────────────────────────────────
/**
 * Coordinates a clean shutdown of every component in the correct order.
 * The force-kill timer ensures we never hang indefinitely.
 */
async function gracefulShutdown(signal) {
    if (isShuttingDown) {
        logger_1.logger.warn(`Shutdown already in progress — ignoring duplicate signal ${signal}`);
        return;
    }
    isShuttingDown = true;
    logger_1.logger.info(`Received ${signal} — initiating graceful shutdown`, {
        workerId: WORKER_ID,
        activeJobs: activeJobCount,
    });
    // ── Force-kill safety net ──────────────────────────────────────────────────
    const forceKillTimer = setTimeout(() => {
        logger_1.logger.error('Graceful shutdown timed out — forcing process exit', {
            workerId: WORKER_ID,
        });
        process.exit(1);
    }, SHUTDOWN_FORCE_KILL_MS);
    // Allow the force-kill timer to be garbage-collected if shutdown succeeds
    forceKillTimer.unref?.();
    try {
        // ── Step a: Stop accepting new jobs ─────────────────────────────────────
        logger_1.logger.info('Pausing all BullMQ Workers (draining)…');
        await Promise.allSettled(bullWorkers.map((w) => w.pause()));
        // ── Step b: Wait for in-flight jobs (max SHUTDOWN_GRACE_PERIOD_MS) ──────
        if (activeJobCount > 0) {
            logger_1.logger.info(`Waiting for ${activeJobCount} active job(s) to finish…`, {
                timeoutMs: SHUTDOWN_GRACE_PERIOD_MS,
            });
            const drainStart = Date.now();
            await Promise.race([
                // Close each worker — BullMQ will wait for in-progress jobs internally
                Promise.all(bullWorkers.map((w) => w.close())),
                new Promise((resolve) => setTimeout(() => {
                    logger_1.logger.warn('Grace period expired — forcing BullMQ close', {
                        remainingJobs: activeJobCount,
                    });
                    resolve();
                }, SHUTDOWN_GRACE_PERIOD_MS)),
            ]);
            logger_1.logger.info('BullMQ Workers drained', {
                durationMs: Date.now() - drainStart,
            });
        }
        else {
            // No active jobs — close immediately
            await Promise.allSettled(bullWorkers.map((w) => w.close()));
            logger_1.logger.info('BullMQ Workers closed (no active jobs)');
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
            await prisma_1.prisma.worker.updateMany({
                where: { id: WORKER_ID },
                data: { status: 'STOPPED', stoppedAt: new Date() },
            });
            logger_1.logger.info('Worker marked STOPPED in database');
        }
        catch (err) {
            logger_1.logger.warn('Failed to mark worker STOPPED in database', { error: err });
        }
        // ── Step f: Publish worker-stopped event ─────────────────────────────────
        await publish('worker-events', JSON.stringify({
            type: 'WORKER_STOPPED',
            workerId: WORKER_ID,
            signal,
            timestamp: new Date().toISOString(),
        }));
        // ── Step g: Close infrastructure connections ──────────────────────────────
        await (0, redis_1.closeRedisConnections)();
        await (0, prisma_1.closePrismaConnection)();
        clearTimeout(forceKillTimer);
        logger_1.logger.info('Graceful shutdown complete', { workerId: WORKER_ID });
        process.exit(0);
    }
    catch (err) {
        logger_1.logger.error('Error during graceful shutdown', { error: err });
        process.exit(1);
    }
}
// ─── Unhandled Error Handlers ─────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    logger_1.logger.error('Uncaught exception — initiating shutdown', {
        workerId: WORKER_ID,
        error: err,
    });
    void gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled promise rejection — initiating shutdown', {
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
async function bootstrap() {
    logger_1.logger.info('═══════════════════════════════════════════════');
    logger_1.logger.info('  @job-scheduler/worker  starting up');
    logger_1.logger.info('═══════════════════════════════════════════════');
    logger_1.logger.info('Worker configuration', {
        workerId: WORKER_ID,
        hostname: HOSTNAME,
        pid: PID,
        queues: env_1.env.WORKER_QUEUES,
        concurrency: env_1.env.WORKER_CONCURRENCY,
        heartbeatIntervalMs: env_1.env.HEARTBEAT_INTERVAL_MS,
        leaseCheckIntervalMs: env_1.env.LEASE_CHECK_INTERVAL_MS,
        staleThresholdMs: env_1.env.WORKER_STALE_THRESHOLD_MS,
        leaseManagerEnabled: env_1.env.ENABLE_LEASE_MANAGER,
        schedulerEnabled: env_1.env.ENABLE_SCHEDULER,
        nodeEnv: env_1.env.NODE_ENV,
    });
    // ── 1. Verify Redis connectivity ───────────────────────────────────────────
    try {
        await redis_1.redis.ping();
        logger_1.logger.info('Redis connectivity verified');
    }
    catch (err) {
        logger_1.logger.error('Redis connectivity check failed — aborting', { error: err });
        process.exit(1);
    }
    // ── 2. Verify Prisma / PostgreSQL connectivity ─────────────────────────────
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('PostgreSQL connectivity verified');
    }
    catch (err) {
        logger_1.logger.error('PostgreSQL connectivity check failed — aborting', { error: err });
        process.exit(1);
    }
    // ── 3. Register worker in database ────────────────────────────────────────
    try {
        await registerWorker(env_1.env.WORKER_QUEUES);
    }
    catch (err) {
        logger_1.logger.error('Worker registration failed — aborting', { error: err });
        process.exit(1);
    }
    // ── 4. Start BullMQ Processors ────────────────────────────────────────────
    startProcessors(env_1.env.WORKER_QUEUES);
    // ── 5. Start HeartbeatService ─────────────────────────────────────────────
    heartbeatService = new heartbeat_service_1.HeartbeatService(WORKER_ID, env_1.env.WORKER_QUEUES.join(','), redis_1.redis, prisma_1.prisma);
    heartbeatService.start();
    // ── 6. Optionally start LeaseManagerService ────────────────────────────────
    if (env_1.env.ENABLE_LEASE_MANAGER) {
        logger_1.logger.info('Lease Manager enabled on this instance');
        leaseManagerService = new lease_manager_service_1.LeaseManagerService(redis_1.redis, prisma_1.prisma, publish);
        leaseManagerService.start();
    }
    else {
        logger_1.logger.info('Lease Manager disabled on this instance (ENABLE_LEASE_MANAGER=false)');
    }
    // ── 7. Optionally start SchedulerService ─────────────────────────────────
    if (env_1.env.ENABLE_SCHEDULER) {
        logger_1.logger.info('Scheduler enabled on this instance');
        schedulerService = new scheduler_service_1.SchedulerService(redis_1.redis, prisma_1.prisma);
        schedulerService.start();
    }
    else {
        logger_1.logger.info('Scheduler disabled on this instance (ENABLE_SCHEDULER=false)');
    }
    // ── 8. Publish worker-started event ───────────────────────────────────────
    await publish('worker-events', JSON.stringify({
        type: 'WORKER_STARTED',
        workerId: WORKER_ID,
        hostname: HOSTNAME,
        pid: PID,
        queues: env_1.env.WORKER_QUEUES,
        timestamp: new Date().toISOString(),
    }));
    logger_1.logger.info('Worker fully initialised — listening for jobs', {
        workerId: WORKER_ID,
        queues: env_1.env.WORKER_QUEUES,
    });
}
// ─── Start ────────────────────────────────────────────────────────────────────
bootstrap().catch((err) => {
    logger_1.logger.error('Bootstrap failed — exiting', { error: err });
    process.exit(1);
});
//# sourceMappingURL=index.js.map