import { z } from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must be at most 100 characters")
            .optional(),
        phone: z
            .string()
            .regex(/^\+?[\d\s-]{7,20}$/, "Invalid phone number")
            .optional()
            .nullable(),
        address: z.string().max(500).optional().nullable(),
        city: z.string().max(100).optional().nullable(),
        country: z.string().max(100).optional().nullable(),
        avatar: z.string().url().optional().nullable(),
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
