/**
 * @file src/types/express.d.ts
 * @description Augments the Express Request interface with application-specific properties.
 * These are attached by authentication middleware and accessible in all controllers.
 */

import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user ID (set by authenticate middleware) */
      userId?: string;
      /** Authenticated user email */
      userEmail?: string;
      /** User role within the current organization context */
      userRole?: Role;
      /** Primary organization ID the user is acting within */
      orgId?: string;
      /** JWT token ID (jti) — used for access token blacklisting on logout */
      jti?: string;
      /** Unique request ID (set by requestId middleware) */
      requestId?: string;
    }
  }
}

export {};
