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
import { Logger } from 'winston';
/**
 * The application-wide Winston logger instance.
 * Import this directly, or use `createChildLogger` for contextual logging.
 */
export declare const logger: Logger;
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
export declare function createChildLogger(meta: ChildLoggerMeta): Logger;
//# sourceMappingURL=logger.d.ts.map