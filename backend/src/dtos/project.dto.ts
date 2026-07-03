/**
 * @file src/dtos/project.dto.ts
 * @description Zod validation schemas for Project-related request bodies and query params.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

/** URL-safe slug: lowercase letters, digits, hyphens only */
const slugSchema = z
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
export const CreateProjectDtoSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code')
    .default('#6366f1'),
});

export type CreateProjectDto = z.infer<typeof CreateProjectDtoSchema>;

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
export const UpdateProjectDtoSchema = CreateProjectDtoSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateProjectDto = z.infer<typeof UpdateProjectDtoSchema>;

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
export const ListProjectsQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean())
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['name', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;
