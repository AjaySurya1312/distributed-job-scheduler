"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
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
const requestIdMiddleware = (req, res, next) => {
    // Respect upstream-provided request IDs (e.g. from API gateways, load balancers)
    // Sanitise to prevent header injection — only accept valid UUID-shaped values
    const upstream = req.headers['x-request-id'];
    const upstreamId = typeof upstream === 'string' && isValidRequestId(upstream)
        ? upstream
        : null;
    const requestId = upstreamId ?? crypto_1.default.randomUUID();
    // Attach to request object for downstream handlers and middlewares
    req.requestId = requestId;
    // Echo the request ID in the response so clients can correlate
    res.setHeader('X-Request-ID', requestId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Validates that a request ID string is a well-formed UUID v4.
 * This prevents header injection via crafted `X-Request-ID` values.
 *
 * @param id - Candidate request ID string
 * @returns `true` if the string matches UUID v4 format
 */
function isValidRequestId(id) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return UUID_REGEX.test(id);
}
exports.default = exports.requestIdMiddleware;
//# sourceMappingURL=request-id.middleware.js.map