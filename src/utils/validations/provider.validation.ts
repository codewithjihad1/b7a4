import { z } from "zod";

export const updateProviderProfileSchema = z.object({
    body: z.object({
        shopName: z
            .string()
            .min(2, "Shop name must be at least 2 characters")
            .max(150, "Shop name must be at most 150 characters")
            .optional(),
        shopLogo: z.string().url().optional().nullable(),
        tradeLicense: z.string().max(100).optional().nullable(),
        description: z.string().max(2000).optional().nullable(),
    }),
});

export type UpdateProviderProfileInput = z.infer<
    typeof updateProviderProfileSchema
>["body"];
