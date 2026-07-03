/**
 * @file logger.ts
 * @description Structured Winston logger for the Worker Service.
 *
 * In production, logs are emitted as single-line JSON objects suitable for
 * log-aggregation pipelines (e.g. Datadog, Loki, CloudWatch).
 * In development, logs are pretty-printed with colours for readability.
 *
 * A `createChildLogger` factory creates loggers pre-bound with contextual
 * metadata (workerId, queueName, jobId) so every line is automatically tagged.
 */

import winston, { format, transports, Logger } from 'winston';
import { env } from './env';
import * as os from 'os';

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_NAME = '@job-scheduler/worker';
const HOSTNAME = os.hostname();
const PID = process.pid;

// ─── Custom Formats ───────────────────────────────────────────────────────────

/**
 * Injects static service metadata into every log entry.
 */
const staticMetaFormat = format((info) => {
  info['service'] = SERVICE_NAME;
  info['hostname'] = HOSTNAME;
  info['pid'] = PID;
  info['env'] = env.NODE_ENV;
  return info;
});

/**
 * Serialises the `error` field — if present — to a plain object so the stack
 * trace survives JSON serialisation.
 */
const errorSerializerFormat = format((info) => {
  if (info['error'] instanceof Error) {
    const err = info['error'] as Error;
    info['error'] = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return info;
});

// ─── Transport Configuration ─────────────────────────────────────────────────

/** Structured JSON format used in production. */
const productionFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  staticMetaFormat(),
  errorSerializerFormat(),
  format.json(),
);

/** Pretty-print format used in development. */
const developmentFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss.SSS' }),
  staticMetaFormat(),
  errorSerializerFormat(),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, service: _s, pid: _p, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n  ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}`
      : '';
    return `${timestamp as string} [${level}] ${message as string}${metaStr}`;
  }),
);

// ─── Root Logger ──────────────────────────────────────────────────────────────

/**
 * The application-wide Winston logger instance.
 * Import this directly, or use `createChildLogger` for contextual logging.
 */
export const logger: Logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: [
    new transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
  silent: env.NODE_ENV === 'test',
});

// ─── Child Logger Factory ─────────────────────────────────────────────────────

/**
 * Contextual metadata that can be bound to a child logger.
 */
export interface ChildLoggerMeta {
  /** The unique ID of this worker instance (UUID). */
  workerId?: string;
  /** The name of the queue being processed. */
  queueName?: string;
  /** The BullMQ / database job ID currently being executed. */
  jobId?: string;
  /** Any additional key/value pairs to include in every log line. */
  [key: string]: unknown;
}

/**
 * Creates a child logger with the provided metadata pre-bound to every log
 * entry produced by that logger. This ensures consistent structured context
 * without having to pass it manually to every `logger.info()` call.
 *
 * @param meta - Contextual metadata to bind (workerId, queueName, jobId, …)
 * @returns A Winston Logger with the metadata applied as default metadata.
 *
 * @example
 * const log = createChildLogger({ workerId: 'abc-123', queueName: 'email', jobId: 'j-999' });
 * log.info('Processing job');
 * // => { level: 'info', message: 'Processing job', workerId: 'abc-123', queueName: 'email', jobId: 'j-999', … }
 */
export function createChildLogger(meta: ChildLoggerMeta): Logger {
  return logger.child(meta);
}
