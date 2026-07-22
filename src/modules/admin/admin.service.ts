import type { ListUsersQuery, ListPendingGearQuery, ListAllOrdersQuery } from "../../utils/validations/admin.validation.js";
import { prisma } from "../../lib/prisma.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.js";
import { NotFoundError } from "../../utils/AppError.js";

const USER_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    isVerified: true,
    city: true,
    country: true,
    createdAt: true,
} as const;

const GEAR_SELECT = {
    id: true,
    title: true,
    slug: true,
    brand: true,
    dailyRentPrice: true,
    approvalStatus: true,
    isAvailable: true,
    deletedAt: true,
    createdAt: true,
    provider: { select: { id: true, name: true, email: true } },
    category: { select: { id: true, name: true } },
} as const;

const ORDER_SELECT = {
    id: true,
    orderNumber: true,
    status: true,
    total: true,
    securityDeposit: true,
    tax: true,
    paymentStatus: true,
    rentalStartDate: true,
    rentalEndDate: true,
    createdAt: true,
    customer: { select: { id: true, name: true, email: true } },
    provider: { select: { id: true, name: true, email: true } },
} as const;

// ── Dashboard Stats ──

export const getDashboardStats = async (from?: Date, to?: Date) => {
    const dateFilter =
        from || to
            ? {
                  createdAt: {
                      ...(from ? { gte: from } : {}),
                      ...(to ? { lte: to } : {}),
                  },
              }
            : {};

    const [
        totalUsers,
        totalProviders,
        totalCustomers,
        totalAdmins,
        totalGear,
        pendingGear,
        activeGear,
        totalOrders,
        revenueResult,
        recentOrders,
        userStatusCounts,
    ] = await Promise.all([
        prisma.user.count({ where: { ...dateFilter } }),
        prisma.user.count({ where: { role: "PROVIDER", ...dateFilter } }),
        prisma.user.count({ where: { role: "CUSTOMER", ...dateFilter } }),
        prisma.user.count({ where: { role: "ADMIN", ...dateFilter } }),
        prisma.gearItem.count({ where: { deletedAt: null, ...dateFilter } }),
        prisma.gearItem.count({ where: { approvalStatus: "PENDING", deletedAt: null } }),
        prisma.gearItem.count({ where: { approvalStatus: "APPROVED", deletedAt: null } }),
        prisma.rentalOrder.count({ where: { ...dateFilter } }),
        prisma.rentalOrder.aggregate({
            _sum: { total: true, tax: true },
            where: { paymentStatus: "SUCCESS", ...dateFilter },
        }),
        prisma.rentalOrder.findMany({
            orderBy: { createdAt: "desc" },
            take: 10,
            select: ORDER_SELECT,
        }),
        prisma.user.groupBy({
            by: ["status"],
            _count: true,
        }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of userStatusCounts) {
        statusMap[s.status] = s._count;
    }

    return {
        users: {
            total: totalUsers,
            customers: totalCustomers,
            providers: totalProviders,
            admins: totalAdmins,
            active: statusMap["ACTIVE"] ?? 0,
            suspended: statusMap["SUSPENDED"] ?? 0,
        },
        gear: {
            total: totalGear,
            pending: pendingGear,
            active: activeGear,
        },
        orders: {
            total: totalOrders,
        },
        revenue: {
            total: (revenueResult._sum as any)?.total ?? 0,
            tax: (revenueResult._sum as any)?.tax ?? 0,
        },
        recentOrders,
    };
};

// ── User Management ──

export const listUsers = async (query: ListUsersQuery) => {
    const { page, limit } = parsePagination(query);
    const { role, status, search } = query;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: USER_SELECT,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
    ]);

    return { users, meta: buildPaginationMeta(total, page, limit) };
};

export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            ...USER_SELECT,
            providerProfile: true,
            _count: {
                select: {
                    gearItems: { where: { deletedAt: null } },
                    customerOrders: true,
                    providerOrders: true,
                },
            },
        },
    });

    if (!user) throw new NotFoundError("User not found");
    return user;
};

export const updateUserRole = async (id: string, role: "CUSTOMER" | "PROVIDER" | "ADMIN") => {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user) throw new NotFoundError("User not found");

    if (role === "PROVIDER") {
        const existing = await prisma.providerProfile.findUnique({ where: { userId: id } });
        if (!existing) {
            await prisma.providerProfile.create({
                data: { userId: id, shopName: "", description: "" },
            });
        }
    }

    if (role === "ADMIN" && user.role !== "ADMIN") {
        return prisma.user.update({ where: { id }, data: { role }, select: USER_SELECT });
    }

    return prisma.user.update({ where: { id }, data: { role }, select: USER_SELECT });
};

export const updateUserStatus = async (id: string, status: "ACTIVE" | "SUSPENDED" | "PENDING") => {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundError("User not found");

    return prisma.user.update({ where: { id }, data: { status }, select: USER_SELECT });
};

// ── Gear Moderation ──

export const listGear = async (query: ListPendingGearQuery) => {
    const { page, limit } = parsePagination(query);
    const { approvalStatus } = query;

    const where: any = { deletedAt: null };
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const [items, total] = await Promise.all([
        prisma.gearItem.findMany({
            where,
            select: GEAR_SELECT,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.gearItem.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(total, page, limit) };
};

export const getGearById = async (id: string) => {
    const item = await prisma.gearItem.findUnique({
        where: { id },
        include: {
            provider: { select: { id: true, name: true, email: true, phone: true } },
            category: { select: { id: true, name: true } },
        },
    });
    if (!item) throw new NotFoundError("Gear item not found");
    return item;
};

// ── Rental Monitoring ──

export const listOrders = async (query: ListAllOrdersQuery) => {
    const { page, limit } = parsePagination(query);
    const { status, customerId, providerId } = query;

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (providerId) where.providerId = providerId;

    const [orders, total] = await Promise.all([
        prisma.rentalOrder.findMany({
            where,
            select: ORDER_SELECT,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.rentalOrder.count({ where }),
    ]);

    return { orders, meta: buildPaginationMeta(total, page, limit) };
};

export const getOrderById = async (id: string) => {
    const order = await prisma.rentalOrder.findUnique({
        where: { id },
        include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            provider: { select: { id: true, name: true, email: true, phone: true } },
            items: {
                include: {
                    gear: {
                        select: { id: true, title: true, dailyRentPrice: true, imageCover: true },
                    },
                },
            },
            payments: true,
        },
    });
    if (!order) throw new NotFoundError("Order not found");
    return order;
};
