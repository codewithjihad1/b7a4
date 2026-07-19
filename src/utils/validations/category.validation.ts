import { z } from "zod";

export const createCategorySchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must be at most 100 characters"),
        description: z.string().max(500).optional(),
        icon: z.string().url().optional(),
    }),
});

export const updateCategorySchema = z.object({
    params: z.object({ id: z.string().uuid("Invalid category ID") }),
    body: z.object({
        name: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must be at most 100 characters")
            .optional(),
        description: z.string().max(500).optional().nullable(),
        icon: z.string().url().optional().nullable(),
        isActive: z.boolean().optional(),
    }),
});

export const categoryIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid("Invalid category ID") }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>["body"];
