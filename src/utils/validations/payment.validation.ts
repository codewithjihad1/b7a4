import { z } from "zod";

export const createPaymentIntentSchema = z.object({
    body: z.object({
        orderId: z.string().uuid("Invalid order ID"),
    }),
});

export const webhookQuerySchema = z.object({
    query: z.object({
        orderId: z.string().uuid("Invalid order ID"),
    }),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>["body"];
