import { z } from "zod";

export const createReviewSchema = z.object({
    body: z.object({
        orderId: z.string().uuid("Invalid order ID"),
        gearId: z.string().uuid("Invalid gear ID"),
        rating: z.coerce.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
        comment: z.string().max(2000).optional(),
    }),
});

export const getGearReviewsSchema = z.object({
    params: z.object({ gearId: z.string().uuid("Invalid gear ID") }),
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
    }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>["body"];
