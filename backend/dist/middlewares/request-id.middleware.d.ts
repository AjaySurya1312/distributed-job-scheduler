/**
 * @file src/middlewares/request-id.middleware.ts
 * @description Attaches a unique UUID to every incoming request for distributed tracing.
 *
 * The request ID is:
 *   - Read from the incoming `X-Request-ID` header if provided by an upstream proxy/gateway.
 *   - Generated as a fresh UUID v4 if no header is present.
 *   - Attached to `req.requestId` for use in logs and error responses.
 *   - Echoed back in the `X-Request-ID` response header so clients can correlate.
 */
import { RequestHandler } from 'express';
/**
 * Request ID middleware.
 *
 * Generates or propagates a unique identifier for each HTTP request.
 * The ID should be included in every log entry and error response to enable
 * end-to-end tracing across distributed services.
 *
 * @example
 * // In app.ts (before routes)
 * app.use(requestIdMiddleware);
 *
 * // In a route handler
 * logger.info('Processing job', { requestId: req.requestId });
 */
export declare const requestIdMiddleware: RequestHandler;
export default requestIdMiddleware;
//# sourceMappingURL=request-id.middleware.d.ts.map