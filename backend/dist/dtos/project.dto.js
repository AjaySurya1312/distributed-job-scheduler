"use strict";
/**
 * @file src/dtos/project.dto.ts
 * @description Zod validation schemas for Project-related request bodies and query params.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListProjectsQuerySchema = exports.UpdateProjectDtoSchema = exports.CreateProjectDtoSchema = void 0;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------
/** URL-safe slug: lowercase letters, digits, hyphens only */
const slugSchema = zod_1.z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
});
// ---------------------------------------------------------------------------
// Create Project
// ---------------------------------------------------------------------------
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProjectDto:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *         slug:
 *           type: string
 *           description: Auto-generated from name if omitted
 *         description:
 *           type: string
 *           maxLength: 500
 *         color:
 *           type: string
 *           description: Hex color code
 *           example: "#6366f1"
 */
exports.CreateProjectDtoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required').max(100),
    slug: slugSchema.optional(),
    description: zod_1.z.string().max(500).optional(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code')
        .default('#6366f1'),
});
// ---------------------------------------------------------------------------
// Update Project (partial)
// ---------------------------------------------------------------------------
/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateProjectDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         color:
 *           type: string
 *         isActive:
 *           type: boolean
 */
exports.UpdateProjectDtoSchema = exports.CreateProjectDtoSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
// ---------------------------------------------------------------------------
// List Projects Query
// ---------------------------------------------------------------------------
/**
 * @swagger
 * components:
 *   schemas:
 *     ListProjectsQuery:
 *       type: object
 *       properties:
 *         search:
 *           type: string
 *         isActive:
 *           type: boolean
 *         page:
 *           type: integer
 *           default: 1
 *         pageSize:
 *           type: integer
 *           default: 20
 *         sortBy:
 *           type: string
 *           enum: [name, createdAt]
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 */
exports.ListProjectsQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    isActive: zod_1.z
        .string()
        .transform((v) => v === 'true')
        .pipe(zod_1.z.boolean())
        .optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
    sortBy: zod_1.z.enum(['name', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=project.dto.js.map