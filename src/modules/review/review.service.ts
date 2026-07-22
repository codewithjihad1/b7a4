import { prisma } from "../../lib/prisma.js";
import {
    NotFoundError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
} from "../../utils/AppError.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.js";
import type { CreateReviewInput } from "../../utils/validations/review.validation.js";

const REVIEW_SELECT = {
    id: true,
    rating: true,
    comment: true,
    createdAt: true,
    updatedAt: true,
    customer: {
        select: { id: true, name: true, avatar: true },
    },
    gear: {
        select: { id: true, title: true, slug: true, imageCover: true },
    },
} as const;

const recalculateProviderRating = async (providerId: string) => {
    const result = await prisma.review.aggregate({
        where: { gear: { providerId } },
        _avg: { rating: true },
        _count: true,
    });

    await prisma.providerProfile.update({
        where: { userId: providerId },
        data: {
            rating: result._avg.rating ?? 0,
            totalReviews: result._count,
        },
    });
};

export const create = async (customerId: string, data: CreateReviewInput) => {
    const order = await prisma.rentalOrder.findUnique({
        where: { id: data.orderId },
        select: {
            id: true,
            customerId: true,
            status: true,
        },
    });

    if (!order) throw new NotFoundError("Order not found");
    if (order.customerId !== customerId) {
        throw new ForbiddenError("This order belongs to another customer");
    }
    if (order.status !== "RETURNED") {
        throw new BadRequestError(
            "You can only review after the gear has been returned",
        );
    }

    const orderItem = await prisma.rentalOrderItem.findFirst({
        where: {
            orderId: data.orderId,
            gearId: data.gearId,
        },
    });

    if (!orderItem) {
        throw new BadRequestError(
            "This gear was not part of the specified order",
        );
    }

    const existingReview = await prisma.review.findFirst({
        where: {
            orderId: data.orderId,
        },
    });

    if (existingReview) {
        throw new ConflictError("You have already reviewed this order");
    }

    const gearReviewExists = await prisma.review.findUnique({
        where: {
            gearId_customerId: {
                gearId: data.gearId,
                customerId,
            },
        },
    });

    if (gearReviewExists) {
        throw new ConflictError(
            "You have already reviewed this gear item",
        );
    }

    const review = await prisma.$transaction(async (tx) => {
        const newReview = await tx.review.create({
            data: {
                gearId: data.gearId,
                customerId,
                orderId: data.orderId,
                rating: data.rating,
                comment: data.comment ?? null,
            },
            select: REVIEW_SELECT,
        });

        const gear = await tx.gearItem.findUnique({
            where: { id: data.gearId },
            select: { providerId: true },
        });

        if (gear) {
            const result = await tx.review.aggregate({
                where: { gearId: data.gearId },
                _avg: { rating: true },
            });

            // Update gear average rating if you add that field later
            // For now, update provider profile rating
            const providerResult = await tx.review.aggregate({
                where: { gear: { providerId: gear.providerId } },
                _avg: { rating: true },
                _count: true,
            });

            await tx.providerProfile.update({
                where: { userId: gear.providerId },
                data: {
                    rating: providerResult._avg.rating ?? 0,
                    totalReviews: providerResult._count,
                },
            });
        }

        return newReview;
    });

    return review;
};

export const getGearReviews = async (
    gearId: string,
    query: { page?: number; limit?: number },
) => {
    const { page, limit, skip } = parsePagination({
        page: query.page,
        limit: query.limit,
    });

    const where = { gearId };

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            select: REVIEW_SELECT,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.review.count({ where }),
    ]);

    const avgResult = await prisma.review.aggregate({
        where,
        _avg: { rating: true },
    });

    return {
        reviews,
        meta: buildPaginationMeta(page, limit, total),
        averageRating: avgResult._avg.rating ?? 0,
    };
};

export const getMyReviews = async (customerId: string) => {
    return prisma.review.findMany({
        where: { customerId },
        select: REVIEW_SELECT,
        orderBy: { createdAt: "desc" },
    });
};

export const deleteReview = async (reviewId: string, customerId: string) => {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { id: true, customerId: true, gearId: true },
    });

    if (!review) throw new NotFoundError("Review not found");
    if (review.customerId !== customerId) {
        throw new ForbiddenError("You can only delete your own reviews");
    }

    await prisma.$transaction(async (tx) => {
        await tx.review.delete({ where: { id: reviewId } });

        const gear = await tx.gearItem.findUnique({
            where: { id: review.gearId },
            select: { providerId: true },
        });

        if (gear) {
            await recalculateProviderRating(gear.providerId);
        }
    });
};
