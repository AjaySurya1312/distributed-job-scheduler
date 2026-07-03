"use strict";
/**
 * @file src/middlewares/requestId.ts
 * @description Assigns a unique UUID to each incoming request for distributed tracing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = requestId;
const crypto_1 = require("crypto");
/**
 * Attaches a unique requestId to each request.
 * Sources the ID from x-request-id header if provided by an upstream proxy,
 * otherwise generates a new UUID.
 */
function requestId(req, res, next) {
    const id = req.headers['x-request-id'] || (0, crypto_1.randomUUID)();
    req.requestId = id;
    res.setHeader('X-Request-ID', id);
    next();
}
//# sourceMappingURL=requestId.js.map