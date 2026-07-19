import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/AppError.js";
import type { UpdateProfileInput } from "../../utils/validations/user.validation.js";

export const getProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            status: true,
            isVerified: true,
            address: true,
            city: true,
            country: true,
            createdAt: true,
            updatedAt: true,
            providerProfile: {
                select: {
                    id: true,
                    shopName: true,
                    shopLogo: true,
                    description: true,
                    rating: true,
                    totalReviews: true,
                },
            },
        },
    });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
};

export const updateProfile = async (
    userId: string,
    data: UpdateProfileInput,
) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.country !== undefined && { country: data.country }),
            ...(data.avatar !== undefined && { avatar: data.avatar }),
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            address: true,
            city: true,
            country: true,
            updatedAt: true,
        },
    });

    return updated;
};
