import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError } from "../../utils/AppError.js";
import type { UpdateProviderProfileInput } from "../../utils/validations/provider.validation.js";

export const getMyProfile = async (userId: string) => {
    const profile = await prisma.providerProfile.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatar: true,
                },
            },
        },
    });

    if (!profile) {
        throw new NotFoundError("Provider profile not found");
    }

    const gearCount = await prisma.gearItem.count({
        where: { providerId: userId, deletedAt: null },
    });

    return { ...profile, totalGear: gearCount };
};

export const updateProfile = async (
    userId: string,
    data: UpdateProviderProfileInput,
) => {
    const profile = await prisma.providerProfile.findUnique({
        where: { userId },
    });

    if (!profile) {
        throw new NotFoundError("Provider profile not found");
    }

    return prisma.providerProfile.update({
        where: { userId },
        data: {
            ...(data.shopName !== undefined && { shopName: data.shopName }),
            ...(data.shopLogo !== undefined && { shopLogo: data.shopLogo }),
            ...(data.tradeLicense !== undefined && { tradeLicense: data.tradeLicense }),
            ...(data.description !== undefined && { description: data.description }),
        },
        include: {
            user: {
                select: { id: true, name: true, email: true, phone: true, avatar: true },
            },
        },
    });
};

export const getPublicProfile = async (providerId: string) => {
    const user = await prisma.user.findFirst({
        where: { id: providerId, role: "PROVIDER", status: "ACTIVE" },
        select: {
            id: true,
            name: true,
            avatar: true,
            providerProfile: {
                select: {
                    shopName: true,
                    shopLogo: true,
                    description: true,
                    rating: true,
                    totalReviews: true,
                },
            },
            gearItems: {
                where: { isAvailable: true, approvalStatus: "APPROVED", deletedAt: null },
                select: { id: true },
            },
        },
    });

    if (!user) {
        throw new NotFoundError("Provider not found");
    }

    return {
        ...user,
        totalGear: user.gearItems.length,
        gearItems: undefined,
    };
};

export const getDashboard = async (userId: string) => {
    const profile = await prisma.providerProfile.findUnique({
        where: { userId },
    });

    if (!profile) {
        throw new NotFoundError("Provider profile not found");
    }

    const [gearCount, orderStats, earnings] = await Promise.all([
        prisma.gearItem.count({
            where: { providerId: userId, deletedAt: null },
        }),
        prisma.rentalOrder.groupBy({
            by: ["status"],
            where: { providerId: userId },
            _count: true,
        }),
        prisma.payment.aggregate({
            where: {
                order: { providerId: userId },
                status: "SUCCESS",
            },
            _sum: { amount: true },
        }),
    ]);

    const ordersByStatus: Record<string, number> = {};
    for (const stat of orderStats) {
        ordersByStatus[stat.status] = stat._count;
    }

    return {
        totalGear: gearCount,
        totalOrders: orderStats.reduce((sum, s) => sum + s._count, 0),
        ordersByStatus,
        totalEarnings: earnings._sum.amount ?? 0,
    };
};
