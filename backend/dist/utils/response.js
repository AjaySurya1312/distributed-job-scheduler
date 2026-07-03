"use strict";
/**
 * @file src/utils/response.ts
 * @description Standardised HTTP response helpers.
 * All responses follow the shape: { success, data, meta? }
 * Errors follow: { success: false, error: { code, message, details? } }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.created = created;
exports.accepted = accepted;
exports.noContent = noContent;
exports.paginated = paginated;
// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
/**
 * Sends a 200 OK success response.
 *
 * @param res        - Express Response object
 * @param data       - Response payload
 * @param statusCode - HTTP status code (default: 200)
 *
 * @example
 * success(res, { user });
 * success(res, { token }, 200);
 */
function success(res, data, statusCode = 200) {
    const body = {
        success: true,
        data,
    };
    res.status(statusCode).json(body);
}
/**
 * Sends a 201 Created response.
 * Used after successfully creating a new resource.
 *
 * @param res  - Express Response object
 * @param data - The newly created resource
 *
 * @example
 * created(res, { user: newUser });
 */
function created(res, data) {
    success(res, data, 201);
}
/**
 * Sends a 202 Accepted response.
 * Used when a request has been accepted for async processing.
 *
 * @param res  - Express Response object
 * @param data - Acknowledgment payload (e.g. job ID, status URL)
 *
 * @example
 * accepted(res, { jobId: job.id, statusUrl: `/jobs/${job.id}` });
 */
function accepted(res, data) {
    success(res, data, 202);
}
/**
 * Sends a 204 No Content response.
 * Used for successful DELETE or update operations that return no body.
 *
 * @param res - Express Response object
 *
 * @example
 * await prisma.user.delete({ where: { id } });
 * noContent(res);
 */
function noContent(res) {
    res.status(204).end();
}
/**
 * Sends a paginated 200 response with a `meta` block containing pagination info.
 *
 * @param res      - Express Response object
 * @param data     - Array of records for the current page
 * @param total    - Total number of matching records (used to compute pages)
 * @param page     - Current page number (1-based)
 * @param pageSize - Number of records per page
 *
 * @example
 * const [users, total] = await Promise.all([
 *   prisma.user.findMany({ skip: (page - 1) * pageSize, take: pageSize }),
 *   prisma.user.count(),
 * ]);
 * paginated(res, users, total, page, pageSize);
 */
function paginated(res, data, total, page, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    const meta = {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
    const body = {
        success: true,
        data,
        meta,
    };
    res.status(200).json(body);
}
//# sourceMappingURL=response.js.map