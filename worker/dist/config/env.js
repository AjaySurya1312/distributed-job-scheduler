"use strict";
/**
 * @file env.ts
 * @description Environment variable validation and typed configuration for the Worker Service.
 *
 * All environment variables are validated at startup using Zod. If required variables
 * are missing or invalid, the process exits immediately with a descriptive error.
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
exports.env = void 0;
const dotenv = __importStar(require("dotenv"));
const zod_1 = require("zod");
// Load .env file before validation
dotenv.config();
/**
 * Zod schema for all environment variables consumed by the worker.
 */
const envSchema = zod_1.z.object({
    // ─── Database ────────────────────────────────────────────────────────────────
    DATABASE_URL: zod_1.z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
    // ─── Redis ───────────────────────────────────────────────────────────────────
    REDIS_URL: zod_1.z.string().url('REDIS_URL must be a valid Redis connection string'),
    // ─── Worker Configuration ────────────────────────────────────────────────────
    /** Number of concurrent jobs this worker processes at once. Default: 5 */
    WORKER_CONCURRENCY: zod_1.z
        .string()
        .default('5')
        .transform((v) => parseInt(v, 10))
        .refine((n) => n >= 1 && n <= 100, 'WORKER_CONCURRENCY must be between 1 and 100'),
    /** Comma-separated list of queue slugs this worker subscribes to. Default: 'default' */
    WORKER_QUEUES: zod_1.z
        .string()
        .default('default')
        .transform((v) => v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)),
    // ─── Intervals (all in milliseconds) ─────────────────────────────────────────
    /** How often the worker publishes a heartbeat. Default: 10 000 ms */
    HEARTBEAT_INTERVAL_MS: zod_1.z
        .string()
        .default('10000')
        .transform((v) => parseInt(v, 10))
        .refine((n) => n >= 1000, 'HEARTBEAT_INTERVAL_MS must be at least 1000ms'),
    /** How often the lease manager scans for stale workers. Default: 15 000 ms */
    LEASE_CHECK_INTERVAL_MS: zod_1.z
        .string()
        .default('15000')
        .transform((v) => parseInt(v, 10))
        .refine((n) => n >= 5000, 'LEASE_CHECK_INTERVAL_MS must be at least 5000ms'),
    /** Time after last heartbeat before a worker is considered stale. Default: 30 000 ms */
    WORKER_STALE_THRESHOLD_MS: zod_1.z
        .string()
        .default('30000')
        .transform((v) => parseInt(v, 10))
        .refine((n) => n >= 5000, 'WORKER_STALE_THRESHOLD_MS must be at least 5000ms'),
    // ─── Feature Flags ───────────────────────────────────────────────────────────
    /** Whether this instance should run the lease manager. Default: 'false' */
    ENABLE_LEASE_MANAGER: zod_1.z
        .string()
        .default('false')
        .transform((v) => v.toLowerCase() === 'true'),
    /** Whether this instance should run the cron scheduler. Default: 'false' */
    ENABLE_SCHEDULER: zod_1.z
        .string()
        .default('false')
        .transform((v) => v.toLowerCase() === 'true'),
    // ─── Logging ──────────────────────────────────────────────────────────────────
    /** Winston log level. Default: 'info' */
    LOG_LEVEL: zod_1.z
        .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
        .default('info'),
    /** Runtime environment. Default: 'development' */
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
});
/**
 * Parse and validate all environment variables. Exits the process on failure.
 */
function validateEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌  Worker environment validation failed:\n');
        result.error.errors.forEach((err) => {
            console.error(`  [${err.path.join('.')}] ${err.message}`);
        });
        console.error('\nPlease fix the above variables in your .env file and restart.');
        process.exit(1);
    }
    return result.data;
}
/**
 * Singleton validated environment object.
 * Import this throughout the worker codebase.
 *
 * @example
 * import { env } from '@/config/env';
 * console.log(env.REDIS_URL);
 */
exports.env = validateEnv();
//# sourceMappingURL=env.js.map