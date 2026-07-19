import { z } from "zod";

const gearConditionEnum = z.enum(["NEW", "GOOD", "USED"]);
const approvalStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const createGearSchema = z.object({
    body: z.object({
        categoryId: z.string().uuid("Invalid category ID"),
        title: z.string().min(2).max(200),
        brand: z.string().min(1).max(100),
        model: z.string().max(100).optional(),
        description: z.string().min(10).max(5000),
        dailyRentPrice: z.coerce.number().positive("Price must be positive"),
        securityDeposit: z.coerce.number().min(0),
        stockQuantity: z.coerce.number().int().positive("Stock must be at least 1"),
        condition: gearConditionEnum,
        weight: z.coerce.number().positive().optional(),
        location: z.string().max(150).optional(),
        imageCover: z.string().url().optional(),
    }),
});

export const updateGearSchema = z.object({
    params: z.object({ id: z.string().uuid("Invalid gear ID") }),
    body: z.object({
        categoryId: z.string().uuid().optional(),
        title: z.string().min(2).max(200).optional(),
        brand: z.string().min(1).max(100).optional(),
        model: z.string().max(100).optional().nullable(),
        description: z.string().min(10).max(5000).optional(),
        dailyRentPrice: z.coerce.number().positive().optional(),
        securityDeposit: z.coerce.number().min(0).optional(),
        stockQuantity: z.coerce.number().int().positive().optional(),
        condition: gearConditionEnum.optional(),
        weight: z.coerce.number().positive().optional().nullable(),
        location: z.string().max(150).optional().nullable(),
        imageCover: z.string().url().optional().nullable(),
        isAvailable: z.boolean().optional(),
    }),
});

export const gearIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid("Invalid gear ID") }),
});

export const browseGearSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        providerId: z.string().uuid().optional(),
        minPrice: z.coerce.number().min(0).optional(),
        maxPrice: z.coerce.number().positive().optional(),
        condition: gearConditionEnum.optional(),
        isAvailable: z.coerce.boolean().optional(),
        sort: z.enum(["price_asc", "price_desc", "rating", "latest"]).optional(),
    }),
});

export const moderateGearSchema = z.object({
    params: z.object({ id: z.string().uuid("Invalid gear ID") }),
    body: z.object({
        approvalStatus: approvalStatusEnum,
    }),
});

export type CreateGearInput = z.infer<typeof createGearSchema>["body"];
export type UpdateGearInput = z.infer<typeof updateGearSchema>["body"];
export type BrowseGearQuery = z.infer<typeof browseGearSchema>["query"];
export type ModerateGearInput = z.infer<typeof moderateGearSchema>["body"];
