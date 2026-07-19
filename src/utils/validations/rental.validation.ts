import { z } from "zod";

const rentalStatusEnum = z.enum([
    "PLACED",
    "CONFIRMED",
    "PAID",
    "PICKED_UP",
    "RETURNED",
    "CANCELLED",
    "REJECTED",
]);

export const placeOrderSchema = z.object({
    body: z.object({
        items: z
            .array(
                z.object({
                    gearId: z.string().uuid("Invalid gear ID"),
                    quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
                }),
            )
            .min(1, "At least one item is required"),
        rentalStartDate: z.coerce.date({ message: "Invalid start date" }),
        rentalEndDate: z.coerce.date({ message: "Invalid end date" }),
        notes: z.string().max(500).optional(),
    }),
});

export const orderIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid("Invalid order ID") }),
});

export const listOrdersSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        status: rentalStatusEnum.optional(),
    }),
});

export const adminListOrdersSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        status: rentalStatusEnum.optional(),
        customerId: z.string().uuid().optional(),
        providerId: z.string().uuid().optional(),
    }),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>["body"];
export type ListOrdersQuery = z.infer<typeof listOrdersSchema>["query"];
export type AdminListOrdersQuery = z.infer<typeof adminListOrdersSchema>["query"];
