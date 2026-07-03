/**
 * @file src/config/logger.ts
 * @description Winston logger configuration with console and rotating file transports.
 * Provides structured JSON logging for production and colorized human-readable
 * output for development. Also exports an HTTP request logging stream for Morgan.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from './env';

// ---------------------------------------------------------------------------
// Custom log format utilities
// ---------------------------------------------------------------------------

/**
 * Formats the log entry as human-readable colorized text for development.
 * Output: [TIMESTAMP] LEVEL: message { ...meta }
 */
const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}${stackStr}`;
  }),
);

/**
 * Formats the log entry as structured JSON for production ingestion
 * by log aggregators (Datadog, ELK, GCP Logging, etc.)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// ---------------------------------------------------------------------------
// Transports
// ---------------------------------------------------------------------------

/** Console transport — always active, format depends on NODE_ENV */
const consoleTransport = new winston.transports.Console({
  format: env.NODE_ENV === 'development' ? devFormat : prodFormat,
  silent: env.NODE_ENV === 'test',
});

/**
 * Rotating file transport for combined logs.
 * Writes JSON, rotates daily, retains 14 days, compresses old files.
 */
const combinedFileTransport = new DailyRotateFile({
  filename: path.join('logs', 'combined-%DATE%.log'),
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
const errorFileTransport = new DailyRotateFile({
  filename: path.join('logs', 'error-%DATE%.log'),
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
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: {
    service: 'codity-api',
    environment: env.NODE_ENV,
  },
  transports:
    env.NODE_ENV === 'production'
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
export const httpLogger = {
  /**
   * Morgan calls write() with each formatted HTTP log line.
   * We trim the trailing newline Morgan appends before passing to Winston.
   */
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

export default logger;
