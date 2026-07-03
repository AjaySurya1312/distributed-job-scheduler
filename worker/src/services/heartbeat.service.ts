/**
 * @file heartbeat.service.ts
 * @description Worker liveness tracking via Redis and PostgreSQL.
 *
 * The HeartbeatService runs on a fixed interval and does two things:
 *
 *  1. **Redis** — HSET `workers:{workerId}` with current metadata and apply a
 *     30-second TTL. If the worker process dies the TTL naturally expires,
 *     which the LeaseManagerService uses to detect stale workers.
 *
 *  2. **PostgreSQL** — INSERT a `WorkerHeartbeat` row with resource metrics so
 *     the API can expose historical worker health dashboards.
 *
 * Resource metrics (CPU %, heap MB) are collected using Node.js built-ins so
 * there are no additional native-module dependencies.
 */

import * as os from 'os';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../config/logger';
import { env } from '../config/env';

// ─── CPU Usage Sampling ───────────────────────────────────────────────────────

/**
 * Captures `process.cpuUsage()` and calculates the CPU utilisation percentage
 * relative to wall-clock time since the last sample.
 */
class CpuSampler {
  private lastSampleAt: number = Date.now();
  private lastCpuUsage: NodeJS.CpuUsage = process.cpuUsage();

  /**
   * Returns the CPU utilisation as a percentage (0–100) since the last call.
   * Takes a new sample at each invocation.
   */
  sample(): number {
    const now = Date.now();
    const usage = process.cpuUsage(this.lastCpuUsage);

    const elapsedMicros = (now - this.lastSampleAt) * 1_000;
    const cpuMicros = usage.user + usage.system;
    const percent =
      elapsedMicros > 0 ? Math.min((cpuMicros / elapsedMicros) * 100, 100) : 0;

    // Reset for next sample
    this.lastSampleAt = now;
    this.lastCpuUsage = process.cpuUsage();

    return Math.round(percent * 100) / 100; // 2 d.p.
  }
}

// ─── HeartbeatService ─────────────────────────────────────────────────────────

/**
 * Maintains worker liveness signals in Redis and PostgreSQL.
 *
 * @example
 * const hb = new HeartbeatService(workerId, 'email', redis, prisma);
 * hb.start();
 * // … later …
 * await hb.stop();
 */
export class HeartbeatService {
  private readonly log;
  private readonly cpuSampler = new CpuSampler();
  private readonly redisKey: string;

  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private activeJobs: number = 0;

  /**
   * @param workerId  - UUID that uniquely identifies this worker instance
   * @param queueName - Human-readable queue name for logging context
   * @param redis     - Shared IORedis client
   * @param prisma    - Shared Prisma client
   */
  constructor(
    private readonly workerId: string,
    private readonly queueName: string,
    private readonly redis: Redis,
    private readonly prisma: PrismaClient,
  ) {
    this.log = createChildLogger({ workerId, queueName });
    this.redisKey = `workers:${workerId}`;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Begins the heartbeat interval. Fires immediately then every
   * `HEARTBEAT_INTERVAL_MS` milliseconds. Safe to call multiple times
   * (subsequent calls are no-ops if already started).
   */
  start(): void {
    if (this.intervalHandle !== null) {
      this.log.warn('HeartbeatService already started — ignoring duplicate start()');
      return;
    }

    this.log.info('Starting HeartbeatService', {
      intervalMs: env.HEARTBEAT_INTERVAL_MS,
    });

    // Fire immediately to register presence as fast as possible
    void this.beat();

    this.intervalHandle = setInterval(() => {
      void this.beat();
    }, env.HEARTBEAT_INTERVAL_MS);

    // Prevent the interval from keeping the Node.js event loop alive
    // if everything else has shut down. The main index.ts handles orderly exit.
    if (this.intervalHandle.unref) {
      this.intervalHandle.unref();
    }
  }

  /**
   * Stops the heartbeat interval and marks the worker as STOPPED in both
   * Redis and PostgreSQL.
   */
  async stop(): Promise<void> {
    this.log.info('Stopping HeartbeatService…');

    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    // Mark STOPPED in Redis (best-effort)
    try {
      await this.redis.hset(this.redisKey, {
        status: 'STOPPED',
        lastBeat: Date.now().toString(),
        activeJobs: '0',
      });
      // Extend TTL so operators can still see the stopped status briefly
      await this.redis.expire(this.redisKey, 60);
    } catch (err) {
      this.log.warn('Failed to set STOPPED status in Redis', { error: err });
    }

    // Mark STOPPED in PostgreSQL
    try {
      await this.prisma.worker.updateMany({
        where: { id: this.workerId },
        data: { status: 'STOPPED', stoppedAt: new Date() },
      });
    } catch (err) {
      this.log.warn('Failed to set STOPPED status in PostgreSQL', { error: err });
    }

    this.log.info('HeartbeatService stopped');
  }

  /**
   * Updates the count of jobs currently being processed by this worker.
   * The new count is included in the very next heartbeat beat.
   *
   * @param count - Current active job count
   */
  updateActiveJobs(count: number): void {
    this.activeJobs = count;
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  /**
   * Performs one heartbeat cycle:
   *  - Writes liveness data to Redis with a 30-second TTL
   *  - Inserts a `WorkerHeartbeat` row in PostgreSQL with resource metrics
   *
   * Errors are caught and logged but never propagated — a failed heartbeat
   * should never kill the worker.
   */
  private async beat(): Promise<void> {
    const now = Date.now();
    const memoryMb =
      Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
    const cpuPercent = this.cpuSampler.sample();

    // ── Redis heartbeat ────────────────────────────────────────────────────
    try {
      const pipeline = this.redis.pipeline();
      pipeline.hset(this.redisKey, {
        status: 'ACTIVE',
        lastBeat: now.toString(),
        activeJobs: this.activeJobs.toString(),
        pid: process.pid.toString(),
        hostname: os.hostname(),
        queueName: this.queueName,
        memoryMb: memoryMb.toString(),
        cpuPercent: cpuPercent.toString(),
      });
      pipeline.expire(this.redisKey, 30); // 30-second TTL
      await pipeline.exec();

      this.log.debug('Redis heartbeat written', { activeJobs: this.activeJobs });
    } catch (err) {
      this.log.error('Failed to write Redis heartbeat', { error: err });
    }

    // ── PostgreSQL heartbeat ───────────────────────────────────────────────
    try {
      await this.prisma.workerHeartbeat.create({
        data: {
          workerId: this.workerId,
          activeJobs: this.activeJobs,
          memoryUsedMb: memoryMb,
          cpuPercent,
          recordedAt: new Date(now),
        },
      });

      // Also update the denormalized lastHeartbeatAt on the Worker row so the
      // LeaseManagerService can query it efficiently with a simple WHERE clause
      await this.prisma.worker.updateMany({
        where: { id: this.workerId },
        data: { lastHeartbeatAt: new Date(now), status: 'ACTIVE' },
      });

      this.log.debug('PostgreSQL heartbeat written', { memoryMb, cpuPercent });
    } catch (err) {
      this.log.error('Failed to write PostgreSQL heartbeat', { error: err });
    }
  }
}
