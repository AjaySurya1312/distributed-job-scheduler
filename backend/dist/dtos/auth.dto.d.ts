/**
 * @file src/dtos/auth.dto.ts
 * @description Zod validation schemas for all authentication-related request bodies.
 */
import { z } from 'zod';
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
export declare const RegisterDtoSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>;
    firstName: z.ZodString;
    lastName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
}, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
}>;
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
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
export declare const LoginDtoSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginDto = z.infer<typeof LoginDtoSchema>;
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
export declare const RefreshTokenDtoSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;
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
export declare const ChangePasswordDtoSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;
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
export declare const API_KEY_SCOPES: readonly ["jobs:read", "jobs:write", "queues:read", "queues:write", "workers:read", "dashboard:read", "admin:read", "admin:write"];
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];
export declare const CreateApiKeyDtoSchema: z.ZodObject<{
    name: z.ZodString;
    scopes: z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    scopes: string[];
    expiresAt?: Date | undefined;
}, {
    name: string;
    scopes: string[];
    expiresAt?: Date | undefined;
}>;
export type CreateApiKeyDto = z.infer<typeof CreateApiKeyDtoSchema>;
//# sourceMappingURL=auth.dto.d.ts.map