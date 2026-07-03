"use strict";
/**
 * @file src/config/logger.ts
 * @description Winston logger configuration with console and rotating file transports.
 * Provides structured JSON logging for production and colorized human-readable
 * output for development. Also exports an HTTP request logging stream for Morgan.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./env");
// ---------------------------------------------------------------------------
// Custom log format utilities
// ---------------------------------------------------------------------------
/**
 * Formats the log entry as human-readable colorized text for development.
 * Output: [TIMESTAMP] LEVEL: message { ...meta }
 */
const devFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}${stackStr}`;
}));
/**
 * Formats the log entry as structured JSON for production ingestion
 * by log aggregators (Datadog, ELK, GCP Logging, etc.)
 */
const prodFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// ---------------------------------------------------------------------------
// Transports
// ---------------------------------------------------------------------------
/** Console transport — always active, format depends on NODE_ENV */
const consoleTransport = new winston_1.default.transports.Console({
    format: env_1.env.NODE_ENV === 'development' ? devFormat : prodFormat,
    silent: env_1.env.NODE_ENV === 'test',
});
/**
 * Rotating file transport for combined logs.
 * Writes JSON, rotates daily, retains 14 days, compresses old files.
 */
const combinedFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: prodFormat,
    level: 'info',
});
/**
 * Rotating file transport for error-only logs.
 * Keeps error logs separate for quick alerting and triage.
 */
const errorFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: prodFormat,
    level: 'error',
});
// Emit events for file transport errors so the process isn't silently broken
combinedFileTransport.on('error', (err) => {
    console.error('[Logger] Combined file transport error:', err);
});
errorFileTransport.on('error', (err) => {
    console.error('[Logger] Error file transport error:', err);
});
// ---------------------------------------------------------------------------
// Logger instance
// ---------------------------------------------------------------------------
/**
 * Primary application logger.
 *
 * @example
 * import { logger } from '@/config/logger';
 * logger.info('Server started', { port: 3000 });
 * logger.error('DB connection failed', { error: err.message });
 */
exports.logger = winston_1.default.createLogger({
    level: env_1.env.LOG_LEVEL,
    defaultMeta: {
        service: 'codity-api',
        environment: env_1.env.NODE_ENV,
    },
    transports: env_1.env.NODE_ENV === 'production'
        ? [consoleTransport, combinedFileTransport, errorFileTransport]
        : [consoleTransport],
    exitOnError: false,
});
// ---------------------------------------------------------------------------
// HTTP request logging stream (Morgan-compatible)
// ---------------------------------------------------------------------------
/**
 * A writable stream that pipes Morgan HTTP request logs into Winston.
 * Wire up in Express: `app.use(morgan('combined', { stream: httpLogger }))`
 *
 * @example
 * import morgan from 'morgan';
 * import { httpLogger } from '@/config/logger';
 * app.use(morgan('combined', { stream: httpLogger }));
 */
exports.httpLogger = {
    /**
     * Morgan calls write() with each formatted HTTP log line.
     * We trim the trailing newline Morgan appends before passing to Winston.
     */
    write: (message) => {
        exports.logger.http(message.trim());
    },
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map