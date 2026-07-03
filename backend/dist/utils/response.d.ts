/**
 * @file src/utils/response.ts
 * @description Standardised HTTP response helpers.
 * All responses follow the shape: { success, data, meta? }
 * Errors follow: { success: false, error: { code, message, details? } }
 */
import { Response } from 'express';
/** Pagination metadata included in list responses */
export interface PaginationMeta {
    /** Total number of records matching the query (before pagination) */
    total: number;
    /** Current page number (1-based) */
    page: number;
    /** Number of records per page */
    pageSize: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there is a next page */
    hasNextPage: boolean;
    /** Whether there is a previous page */
    hasPreviousPage: boolean;
}
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
export declare function success<T>(res: Response, data: T, statusCode?: number): void;
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
export declare function created<T>(res: Response, data: T): void;
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
export declare function accepted<T>(res: Response, data: T): void;
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
export declare function noContent(res: Response): void;
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
export declare function paginated<T>(res: Response, data: T[], total: number, page: number, pageSize: number): void;
//# sourceMappingURL=response.d.ts.map