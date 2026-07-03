"use strict";
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
exports.logger = void 0;
exports.createChildLogger = createChildLogger;
const winston_1 = __importStar(require("winston"));
const env_1 = require("./env");
const os = __importStar(require("os"));
// ─── Constants ────────────────────────────────────────────────────────────────
const SERVICE_NAME = '@job-scheduler/worker';
const HOSTNAME = os.hostname();
const PID = process.pid;
// ─── Custom Formats ───────────────────────────────────────────────────────────
/**
 * Injects static service metadata into every log entry.
 */
const staticMetaFormat = (0, winston_1.format)((info) => {
    info['service'] = SERVICE_NAME;
    info['hostname'] = HOSTNAME;
    info['pid'] = PID;
    info['env'] = env_1.env.NODE_ENV;
    return info;
});
/**
 * Serialises the `error` field — if present — to a plain object so the stack
 * trace survives JSON serialisation.
 */
const errorSerializerFormat = (0, winston_1.format)((info) => {
    if (info['error'] instanceof Error) {
        const err = info['error'];
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
const productionFormat = winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }), staticMetaFormat(), errorSerializerFormat(), winston_1.format.json());
/** Pretty-print format used in development. */
const developmentFormat = winston_1.format.combine(winston_1.format.timestamp({ format: 'HH:mm:ss.SSS' }), staticMetaFormat(), errorSerializerFormat(), winston_1.format.colorize({ all: true }), winston_1.format.printf(({ timestamp, level, message, service: _s, pid: _p, ...meta }) => {
    const metaStr = Object.keys(meta).length
        ? `\n  ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}`
        : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
}));
// ─── Root Logger ──────────────────────────────────────────────────────────────
/**
 * The application-wide Winston logger instance.
 * Import this directly, or use `createChildLogger` for contextual logging.
 */
exports.logger = winston_1.default.createLogger({
    level: env_1.env.LOG_LEVEL,
    format: env_1.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    transports: [
        new winston_1.transports.Console({
            handleExceptions: true,
            handleRejections: true,
        }),
    ],
    exitOnError: false,
    silent: env_1.env.NODE_ENV === 'test',
});
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
function createChildLogger(meta) {
    return exports.logger.child(meta);
}
//# sourceMappingURL=logger.js.map