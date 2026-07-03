/**
 * @file src/utils/response.ts
 * @description Standardised HTTP response helpers.
 * All responses follow the shape: { success, data, meta? }
 * Errors follow: { success: false, error: { code, message, details? } }
 */

import { Response } from 'express';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Standard success response envelope */
interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

/** Success response with pagination metadata */
interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

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
export function success<T>(
  res: Response,
  data: T,
  statusCode = 200,
): void {
  const body: SuccessEnvelope<T> = {
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
export function created<T>(res: Response, data: T): void {
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
export function accepted<T>(res: Response, data: T): void {
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
export function noContent(res: Response): void {
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
export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): void {
  const totalPages = Math.ceil(total / pageSize);

  const meta: PaginationMeta = {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  const body: PaginatedEnvelope<T> = {
    success: true,
    data,
    meta,
  };

  res.status(200).json(body);
}
