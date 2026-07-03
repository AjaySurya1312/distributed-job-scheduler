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
import { Request, Response, NextFunction, RequestHandler } from 'express';
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;
/**
 * Wraps an async Express request handler to automatically forward
 * any thrown errors to the `next` error-handling middleware.
 *
 * @param fn - The async route handler function
 * @returns A synchronous Express RequestHandler
 */
export declare function tryCatch(fn: AsyncRequestHandler): RequestHandler;
export {};
//# sourceMappingURL=asyncHandler.d.ts.map