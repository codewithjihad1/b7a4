import { prisma } from "../../lib/prisma.js";
import {
    NotFoundError,
    ForbiddenError,
    ConflictError,
    BadRequestError,
} from "../../utils/AppError.js";
import { generateSlug } from "../../utils/slugify.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.js";
import type {
    CreateGearInput,
    UpdateGearInput,
    BrowseGearQuery,
    ModerateGearInput,
} from "../../utils/validations/gear.validation.js";

const GEAR_SELECT = {
    id: true,
    title: true,
    slug: true,
    brand: true,
    model: true,
    description: true,
    dailyRentPrice: true,
    securityDeposit: true,
    stockQuantity: true,
    availableQuantity: true,
    condition: true,
    weight: true,
    location: true,
    imageCover: true,
    isAvailable: true,
    approvalStatus: true,
    createdAt: true,
    updatedAt: true,
    category: {
        select: { id: true, name: true, slug: true },
    },
    provider: {
        select: {
            id: true,
            name: true,
            avatar: true,
            providerProfile: {
                select: { shopName: true, shopLogo: true, rating: true },
            },
        },
    },
    _count: { select: { reviews: true, orderItems: true } },
} as const;

const calculateAverageRating = async (gearId: string) => {
    const result = await prisma.review.aggregate({
        where: { gearId },
        _avg: { rating: true },
    });
    return result._avg.rating ?? 0;
};

export const create = async (providerId: string, data: CreateGearInput) => {
    const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
    });
    if (!category || !category.isActive) {
        throw new NotFoundError("Category not found or inactive");
    }

    const slug = generateSlug(data.title);
    const existingSlug = await prisma.gearItem.findUnique({ where: { slug } });
    if (existingSlug) {
        throw new ConflictError("A gear item with a similar title already exists");
    }

    const gear = await prisma.gearItem.create({
        data: {
            providerId,
            categoryId: data.categoryId,
            title: data.title,
            slug,
            brand: data.brand,
            model: data.model ?? null,
            description: data.description,
            dailyRentPrice: data.dailyRentPrice,
            securityDeposit: data.securityDeposit,
            stockQuantity: data.stockQuantity,
            availableQuantity: data.stockQuantity,
            condition: data.condition,
            weight: data.weight ?? null,
            location: data.location ?? null,
            imageCover: data.imageCover ?? null,
        },
        select: GEAR_SELECT,
    });

    return gear;
};

export const update = async (
    gearId: string,
    providerId: string,
    data: UpdateGearInput,
) => {
    const gear = await prisma.gearItem.findUnique({ where: { id: gearId } });

    if (!gear) {
        throw new NotFoundError("Gear item not found");
    }
    if (gear.providerId !== providerId) {
        throw new ForbiddenError("You can only update your own gear");
    }

    if (data.title && data.title !== gear.title) {
        const slug = generateSlug(data.title);
        const existing = await prisma.gearItem.findUnique({ where: { slug } });
        if (existing && existing.id !== gearId) {
            throw new ConflictError("A gear item with a similar title already exists");
        }
    }

    if (data.stockQuantity !== undefined) {
        const difference = data.stockQuantity - gear.stockQuantity;
        data = {
            ...data,
            stockQuantity: data.stockQuantity,
        };
        if (difference > 0) {
            (data as Record<string, unknown>).availableQuantity =
                gear.availableQuantity + difference;
        }
    }

    const updated = await prisma.gearItem.update({
        where: { id: gearId },
        data: {
            ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
            ...(data.title !== undefined && { title: data.title, slug: generateSlug(data.title) }),
            ...(data.brand !== undefined && { brand: data.brand }),
            ...(data.model !== undefined && { model: data.model }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.dailyRentPrice !== undefined && { dailyRentPrice: data.dailyRentPrice }),
            ...(data.securityDeposit !== undefined && { securityDeposit: data.securityDeposit }),
            ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
            ...(data.condition !== undefined && { condition: data.condition }),
            ...(data.weight !== undefined && { weight: data.weight }),
            ...(data.location !== undefined && { location: data.location }),
            ...(data.imageCover !== undefined && { imageCover: data.imageCover }),
            ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
        },
        select: GEAR_SELECT,
    });

    return updated;
};

export const remove = async (gearId: string, providerId: string) => {
    const gear = await prisma.gearItem.findUnique({ where: { id: gearId } });

    if (!gear) {
        throw new NotFoundError("Gear item not found");
    }
    if (gear.providerId !== providerId) {
        throw new ForbiddenError("You can only delete your own gear");
    }

    const activeOrders = await prisma.rentalOrderItem.findFirst({
        where: {
            gearId,
            order: {
                status: { in: ["PLACED", "CONFIRMED", "PAID", "PICKED_UP"] },
            },
        },
    });

    if (activeOrders) {
        throw new BadRequestError(
            "Cannot delete gear with active rental orders",
        );
    }

    await prisma.gearItem.update({
        where: { id: gearId },
        data: { deletedAt: new Date(), isAvailable: false },
    });
};

export const getById = async (gearId: string) => {
    const gear = await prisma.gearItem.findFirst({
        where: {
            id: gearId,
            deletedAt: null,
            approvalStatus: "APPROVED",
        },
        select: GEAR_SELECT,
    });

    if (!gear) {
        throw new NotFoundError("Gear item not found");
    }

    const avgRating = await calculateAverageRating(gearId);

    return { ...gear, averageRating: avgRating };
};

export const browse = async (query: BrowseGearQuery) => {
    const { page, limit, skip } = parsePagination({
        page: query.page,
        limit: query.limit,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
        deletedAt: null,
        approvalStatus: "APPROVED",
        isAvailable: true,
    };

    if (query.search) {
        where.OR = [
            { title: { contains: query.search, mode: "insensitive" } },
            { brand: { contains: query.search, mode: "insensitive" } },
        ];
    }

    if (query.categoryId) {
        where.categoryId = query.categoryId;
    }

    if (query.providerId) {
        where.providerId = query.providerId;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.dailyRentPrice = {};
        if (query.minPrice !== undefined) where.dailyRentPrice.gte = query.minPrice;
        if (query.maxPrice !== undefined) where.dailyRentPrice.lte = query.maxPrice;
    }

    if (query.condition) {
        where.condition = query.condition;
    }

    if (query.isAvailable !== undefined) {
        where.isAvailable = query.isAvailable;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };

    switch (query.sort) {
        case "price_asc":
            orderBy = { dailyRentPrice: "asc" };
            break;
        case "price_desc":
            orderBy = { dailyRentPrice: "desc" };
            break;
        case "latest":
            orderBy = { createdAt: "desc" };
            break;
    }

    const [items, total] = await Promise.all([
        prisma.gearItem.findMany({
            where,
            select: GEAR_SELECT,
            orderBy,
            skip,
            take: limit,
        }),
        prisma.gearItem.count({ where }),
    ]);

    return {
        items,
        meta: buildPaginationMeta(page, limit, total),
    };
};

export const getProviderGear = async (providerId: string) => {
    return prisma.gearItem.findMany({
        where: { providerId, deletedAt: null },
        select: GEAR_SELECT,
        orderBy: { createdAt: "desc" },
    });
};

export const moderate = async (gearId: string, data: ModerateGearInput) => {
    const gear = await prisma.gearItem.findUnique({ where: { id: gearId } });

    if (!gear) {
        throw new NotFoundError("Gear item not found");
    }

    return prisma.gearItem.update({
        where: { id: gearId },
        data: { approvalStatus: data.approvalStatus },
        select: GEAR_SELECT,
    });
};

export const getAllAdmin = async () => {
    return prisma.gearItem.findMany({
        where: { deletedAt: null },
        select: GEAR_SELECT,
        orderBy: { createdAt: "desc" },
    });
};

export const updateStock = async (
    gearId: string,
    providerId: string,
    availableQuantity: number,
) => {
    const gear = await prisma.gearItem.findUnique({ where: { id: gearId } });

    if (!gear) {
        throw new NotFoundError("Gear item not found");
    }
    if (gear.providerId !== providerId) {
        throw new ForbiddenError("You can only update your own gear");
    }
    if (availableQuantity < 0 || availableQuantity > gear.stockQuantity) {
        throw new BadRequestError(
            "Available quantity must be between 0 and stock quantity",
        );
    }

    return prisma.gearItem.update({
        where: { id: gearId },
        data: {
            availableQuantity,
            isAvailable: availableQuantity > 0,
        },
        select: GEAR_SELECT,
    });
};
