import { z } from "zod";

const roleEnum = z.enum(["CUSTOMER", "PROVIDER", "ADMIN"]);
const userStatusEnum = z.enum(["ACTIVE", "SUSPENDED", "PENDING"]);
const approvalStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
const rentalStatusEnum = z.enum([
    "PLACED",
    "CONFIRMED",
    "PAID",
    "PICKED_UP",
    "RETURNED",
    "CANCELLED",
    "REJECTED",
]);

export const listUsersSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        role: roleEnum.optional(),
        status: userStatusEnum.optional(),
        search: z.string().optional(),
    }),
});

export const userIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid("Invalid user ID") }),
});

export const updateUserRoleSchema = z.object({
    body: z.object({
        role: roleEnum,
    }),
});

export const updateUserStatusSchema = z.object({
    body: z.object({
        status: userStatusEnum,
    }),
});

export const listPendingGearSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        approvalStatus: approvalStatusEnum.optional(),
    }),
});

export const gearIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid("Invalid gear ID") }),
});

export const approveGearSchema = z.object({
    body: z.object({}).strict(),
});

export const rejectGearSchema = z.object({
    body: z.object({
        reason: z.string().max(500).optional(),
    }),
});

export const listAllOrdersSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        status: rentalStatusEnum.optional(),
        customerId: z.string().uuid().optional(),
        providerId: z.string().uuid().optional(),
    }),
});

export const dashboardStatsSchema = z.object({
    query: z.object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
    }),
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>["query"];
export type ListPendingGearQuery = z.infer<typeof listPendingGearSchema>["query"];
export type ListAllOrdersQuery = z.infer<typeof listAllOrdersSchema>["query"];
