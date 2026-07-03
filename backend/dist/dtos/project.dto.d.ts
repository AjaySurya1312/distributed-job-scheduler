/**
 * @file src/dtos/project.dto.ts
 * @description Zod validation schemas for Project-related request bodies and query params.
 */
import { z } from 'zod';
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
export declare const CreateProjectDtoSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    color: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    color: string;
    slug?: string | undefined;
    description?: string | undefined;
}, {
    name: string;
    slug?: string | undefined;
    description?: string | undefined;
    color?: string | undefined;
}>;
export type CreateProjectDto = z.infer<typeof CreateProjectDtoSchema>;
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
export declare const UpdateProjectDtoSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    color: z.ZodOptional<z.ZodDefault<z.ZodString>>;
} & {
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    color?: string | undefined;
}, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    color?: string | undefined;
}>;
export type UpdateProjectDto = z.infer<typeof UpdateProjectDtoSchema>;
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
export declare const ListProjectsQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, boolean, string>, z.ZodBoolean>>;
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["name", "createdAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sortBy: "name" | "createdAt";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    isActive?: boolean | undefined;
}, {
    search?: string | undefined;
    isActive?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    sortBy?: "name" | "createdAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;
//# sourceMappingURL=project.dto.d.ts.map