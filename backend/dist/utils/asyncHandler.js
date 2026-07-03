"use strict";
/**
 * @file src/utils/asyncHandler.ts
 * @description Wraps async route handlers to forward errors to Express error middleware.
 * Eliminates the need for try/catch blocks in every controller function.
 *
 * @example
 * router.get("/users/:id", tryCatch(async (req, res) => {
 *   const user = await userService.findById(req.params.id);
 *   sendOk(res, user);
 * }));
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryCatch = tryCatch;
/**
 * Wraps an async Express request handler to automatically forward
 * any thrown errors to the `next` error-handling middleware.
 *
 * @param fn - The async route handler function
 * @returns A synchronous Express RequestHandler
 */
function tryCatch(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=asyncHandler.js.map