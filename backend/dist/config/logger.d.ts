/**
 * @file src/config/logger.ts
 * @description Winston logger configuration with console and rotating file transports.
 * Provides structured JSON logging for production and colorized human-readable
 * output for development. Also exports an HTTP request logging stream for Morgan.
 */
import winston from 'winston';
/**
 * Primary application logger.
 *
 * @example
 * import { logger } from '@/config/logger';
 * logger.info('Server started', { port: 3000 });
 * logger.error('DB connection failed', { error: err.message });
 */
export declare const logger: winston.Logger;
/**
 * A writable stream that pipes Morgan HTTP request logs into Winston.
 * Wire up in Express: `app.use(morgan('combined', { stream: httpLogger }))`
 *
 * @example
 * import morgan from 'morgan';
 * import { httpLogger } from '@/config/logger';
 * app.use(morgan('combined', { stream: httpLogger }));
 */
export declare const httpLogger: {
    /**
     * Morgan calls write() with each formatted HTTP log line.
     * We trim the trailing newline Morgan appends before passing to Winston.
     */
    write: (message: string) => void;
};
export default logger;
//# sourceMappingURL=logger.d.ts.map