"use strict";
/**
 * @file src/dtos/auth.dto.ts
 * @description Zod validation schemas for all authentication-related request bodies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateApiKeyDtoSchema = exports.API_KEY_SCOPES = exports.ChangePasswordDtoSchema = exports.RefreshTokenDtoSchema = exports.LoginDtoSchema = exports.RegisterDtoSchema = void 0;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Password strength helper
// ---------------------------------------------------------------------------
const strongPassword = zod_1.z
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
exports.RegisterDtoSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: strongPassword,
    firstName: zod_1.z.string().min(1, 'First name is required').max(50),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50),
});
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
exports.LoginDtoSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
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
exports.RefreshTokenDtoSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
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
exports.ChangePasswordDtoSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: strongPassword,
})
    .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
});
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
exports.API_KEY_SCOPES = [
    'jobs:read',
    'jobs:write',
    'queues:read',
    'queues:write',
    'workers:read',
    'dashboard:read',
    'admin:read',
    'admin:write',
];
exports.CreateApiKeyDtoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'API key name is required').max(100),
    scopes: zod_1.z
        .array(zod_1.z.string())
        .min(1, 'At least one scope is required')
        .refine((scopes) => scopes.every((s) => exports.API_KEY_SCOPES.includes(s)), { message: `Invalid scope. Must be one of: ${exports.API_KEY_SCOPES.join(', ')}` }),
    expiresAt: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=auth.dto.js.map