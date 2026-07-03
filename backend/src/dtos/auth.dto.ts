/**
 * @file src/dtos/auth.dto.ts
 * @description Zod validation schemas for all authentication-related request bodies.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Password strength helper
// ---------------------------------------------------------------------------

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((val) => /[0-9]/.test(val), {
    message: 'Password must contain at least one number',
  })
  .refine((val) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val), {
    message: 'Password must contain at least one special character',
  });

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterDto:
 *       type: object
 *       required: [email, password, firstName, lastName]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 */
export const RegisterDtoSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: strongPassword,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginDto:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 */
export const LoginDtoSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     RefreshTokenDto:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken:
 *           type: string
 */
export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;

// ---------------------------------------------------------------------------
// Change Password
// ---------------------------------------------------------------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     ChangePasswordDto:
 *       type: object
 *       required: [currentPassword, newPassword]
 *       properties:
 *         currentPassword:
 *           type: string
 *         newPassword:
 *           type: string
 *           minLength: 8
 */
export const ChangePasswordDtoSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPassword,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

// ---------------------------------------------------------------------------
// Create API Key
// ---------------------------------------------------------------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateApiKeyDto:
 *       type: object
 *       required: [name, scopes]
 *       properties:
 *         name:
 *           type: string
 *         scopes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["jobs:read", "jobs:write"]
 *         expiresAt:
 *           type: string
 *           format: date-time
 */

export const API_KEY_SCOPES = [
  'jobs:read',
  'jobs:write',
  'queues:read',
  'queues:write',
  'workers:read',
  'dashboard:read',
  'admin:read',
  'admin:write',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export const CreateApiKeyDtoSchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100),
  scopes: z
    .array(z.string())
    .min(1, 'At least one scope is required')
    .refine(
      (scopes) =>
        scopes.every((s) => (API_KEY_SCOPES as readonly string[]).includes(s)),
      { message: `Invalid scope. Must be one of: ${API_KEY_SCOPES.join(', ')}` },
    ),
  expiresAt: z.coerce.date().optional(),
});

export type CreateApiKeyDto = z.infer<typeof CreateApiKeyDtoSchema>;
