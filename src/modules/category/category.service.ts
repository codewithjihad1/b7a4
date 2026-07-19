import { prisma } from "../../lib/prisma.js";
import { ConflictError, NotFoundError } from "../../utils/AppError.js";
import { generateSlug } from "../../utils/slugify.js";
import type {
    CreateCategoryInput,
    UpdateCategoryInput,
} from "../../utils/validations/category.validation.js";

export const create = async (data: CreateCategoryInput) => {
    const slug = generateSlug(data.name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
        throw new ConflictError("Category with this name already exists");
    }

    return prisma.category.create({
        data: {
            name: data.name,
            slug,
            ...(data.description !== undefined && { description: data.description }),
            ...(data.icon !== undefined && { icon: data.icon }),
        },
    });
};

export const getAll = async () => {
    return prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            _count: { select: { gearItems: { where: { isAvailable: true, approvalStatus: "APPROVED" } } } },
        },
    });
};

export const getAllAdmin = async () => {
    return prisma.category.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            isActive: true,
            _count: { select: { gearItems: true } },
            createdAt: true,
        },
    });
};

export const getById = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { gearItems: true } } },
    });

    if (!category) {
        throw new NotFoundError("Category not found");
    }

    return category;
};

export const update = async (id: string, data: UpdateCategoryInput) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
        throw new NotFoundError("Category not found");
    }

    if (data.name && data.name !== category.name) {
        const slug = generateSlug(data.name);
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (existing && existing.id !== id) {
            throw new ConflictError("Category with this name already exists");
        }
        data = { ...data, name: data.name };
    }

    return prisma.category.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.icon !== undefined && { icon: data.icon }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
    });
};

export const remove = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id },
        select: { id: true, _count: { select: { gearItems: true } } },
    });

    if (!category) {
        throw new NotFoundError("Category not found");
    }

    if (category._count.gearItems > 0) {
        throw new ConflictError(
            "Cannot delete category with existing gear items. Disable it instead.",
        );
    }

    return prisma.category.delete({ where: { id } });
};
