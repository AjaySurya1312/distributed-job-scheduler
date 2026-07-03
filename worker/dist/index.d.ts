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
//# sourceMappingURL=index.d.ts.map