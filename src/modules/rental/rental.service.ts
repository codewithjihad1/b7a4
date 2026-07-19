import { Decimal } from "@prisma/client/runtime/client.js";
import { prisma } from "../../lib/prisma.js";
import {
    NotFoundError,
    BadRequestError,
    ForbiddenError,
} from "../../utils/AppError.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.js";
import { TAX_RATE } from "../../config/constants.js";
import type {
    PlaceOrderInput,
    ListOrdersQuery,
    AdminListOrdersQuery,
} from "../../utils/validations/rental.validation.js";

const ORDER_SELECT = {
    id: true,
    orderNumber: true,
    customerId: true,
    providerId: true,
    subtotal: true,
    discount: true,
    tax: true,
    securityDeposit: true,
    total: true,
    rentalStartDate: true,
    rentalEndDate: true,
    status: true,
    paymentStatus: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    customer: {
        select: { id: true, name: true, email: true, phone: true },
    },
    provider: {
        select: {
            id: true,
            name: true,
            providerProfile: { select: { shopName: true } },
        },
    },
    items: {
        select: {
            id: true,
            quantity: true,
            dailyPrice: true,
            days: true,
            securityDeposit: true,
            subtotal: true,
            gear: {
                select: { id: true, title: true, slug: true, imageCover: true },
            },
        },
    },
    payments: {
        select: {
            id: true,
            transactionId: true,
            amount: true,
            status: true,
            provider: true,
            paidAt: true,
        },
    },
} as const;

const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
};

const calculateDays = (start: Date, end: Date): number => {
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
};

const checkDateOverlap = async (
    gearId: string,
    startDate: Date,
    endDate: Date,
    quantity: number,
): Promise<boolean> => {
    const overlappingItems = await prisma.rentalOrderItem.findMany({
        where: {
            gearId,
            order: {
                status: { in: ["PLACED", "CONFIRMED", "PAID", "PICKED_UP"] },
            },
        },
        select: {
            quantity: true,
            order: {
                select: { rentalStartDate: true, rentalEndDate: true },
            },
        },
    });

    let totalBooked = 0;
    for (const item of overlappingItems) {
        const orderStart = item.order.rentalStartDate;
        const orderEnd = item.order.rentalEndDate;

        const hasOverlap =
            startDate <= orderEnd && endDate >= orderStart;

        if (hasOverlap) {
            totalBooked += item.quantity;
        }
    }

    const gear = await prisma.gearItem.findUnique({
        where: { id: gearId },
        select: { availableQuantity: true },
    });

    if (!gear) return true;

    return totalBooked + quantity > gear.availableQuantity;
};

export const placeOrder = async (
    customerId: string,
    data: PlaceOrderInput,
) => {
    if (data.rentalEndDate <= data.rentalStartDate) {
        throw new BadRequestError("End date must be after start date");
    }

    const days = calculateDays(data.rentalStartDate, data.rentalEndDate);

    const gearIds = data.items.map((i) => i.gearId);
    const gearItems = await prisma.gearItem.findMany({
        where: {
            id: { in: gearIds },
            isAvailable: true,
            approvalStatus: "APPROVED",
            deletedAt: null,
        },
    });

    if (gearItems.length !== gearIds.length) {
        throw new BadRequestError(
            "One or more gear items are not available or not approved",
        );
    }

    for (const item of data.items) {
        const gear = gearItems.find((g) => g.id === item.gearId);
        if (!gear) continue;

        if (gear.providerId === customerId) {
            throw new BadRequestError(
                "You cannot rent your own gear",
            );
        }

        if (gear.availableQuantity < item.quantity) {
            throw new BadRequestError(
                `Insufficient stock for "${gear.title}". Available: ${gear.availableQuantity}, requested: ${item.quantity}`,
            );
        }

        const hasOverlap = await checkDateOverlap(
            item.gearId,
            data.rentalStartDate,
            data.rentalEndDate,
            item.quantity,
        );
        if (hasOverlap) {
            throw new BadRequestError(
                `Not enough inventory for "${gear.title}" during the selected dates`,
            );
        }
    }

    let subtotal = new Decimal(0);
    let totalDeposit = new Decimal(0);

    const orderItems = data.items.map((item) => {
        const gear = gearItems.find((g) => g.id === item.gearId)!;
        const dailyPrice = new Decimal(gear.dailyRentPrice);
        const itemSubtotal = dailyPrice.mul(days).mul(item.quantity);
        const itemDeposit = new Decimal(gear.securityDeposit).mul(item.quantity);

        subtotal = subtotal.add(itemSubtotal);
        totalDeposit = totalDeposit.add(itemDeposit);

        return {
            gearId: item.gearId,
            quantity: item.quantity,
            dailyPrice,
            days,
            securityDeposit: itemDeposit,
            subtotal: itemSubtotal,
        };
    });

    const tax = subtotal.mul(TAX_RATE);
    const total = subtotal.add(tax).add(totalDeposit);

    const providerId = gearItems[0]!.providerId;

    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.rentalOrder.create({
            data: {
                customerId,
                providerId,
                orderNumber: generateOrderNumber(),
                subtotal,
                discount: 0,
                tax,
                securityDeposit: totalDeposit,
                total,
                rentalStartDate: data.rentalStartDate,
                rentalEndDate: data.rentalEndDate,
                notes: data.notes ?? null,
                items: { create: orderItems },
            },
            select: ORDER_SELECT,
        });

        return newOrder;
    });

    return order;
};

export const confirmOrder = async (
    orderId: string,
    providerId: string,
) => {
    const order = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
    });

    if (!order) throw new NotFoundError("Order not found");
    if (order.providerId !== providerId) {
        throw new ForbiddenError("This order belongs to another provider");
    }
    if (order.status !== "PLACED") {
        throw new BadRequestError(`Cannot confirm order with status: ${order.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        const items = await tx.rentalOrderItem.findMany({
            where: { orderId },
        });

        for (const item of items) {
            const gear = await tx.gearItem.findUnique({
                where: { id: item.gearId },
            });
            if (!gear) throw new NotFoundError("Gear not found");

            const newAvailable = gear.availableQuantity - item.quantity;
            if (newAvailable < 0) {
                throw new BadRequestError(
                    `Insufficient stock for gear item`,
                );
            }

            await tx.gearItem.update({
                where: { id: item.gearId },
                data: {
                    availableQuantity: newAvailable,
                    isAvailable: newAvailable > 0,
                },
            });
        }

        return tx.rentalOrder.update({
            where: { id: orderId },
            data: { status: "CONFIRMED" },
            select: ORDER_SELECT,
        });
    });

    return updated;
};

export const rejectOrder = async (
    orderId: string,
    providerId: string,
) => {
    const order = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
    });

    if (!order) throw new NotFoundError("Order not found");
    if (order.providerId !== providerId) {
        throw new ForbiddenError("This order belongs to another provider");
    }
    if (order.status !== "PLACED") {
        throw new BadRequestError(`Cannot reject order with status: ${order.status}`);
    }

    return prisma.rentalOrder.update({
        where: { id: orderId },
        data: { status: "REJECTED" },
        select: ORDER_SELECT,
    });
};

export const cancelOrder = async (
    orderId: string,
    userId: string,
) => {
    const order = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
    });

    if (!order) throw new NotFoundError("Order not found");
    if (order.customerId !== userId) {
        throw new ForbiddenError("You can only cancel your own orders");
    }
    if (!["PLACED", "CONFIRMED"].includes(order.status)) {
        throw new BadRequestError(`Cannot cancel order with status: ${order.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        if (order.status === "CONFIRMED") {
            const items = await tx.rentalOrderItem.findMany({
                where: { orderId },
            });

            for (const item of items) {
                const gear = await tx.gearItem.findUnique({
                    where: { id: item.gearId },
                });
                if (!gear) continue;

                await tx.gearItem.update({
                    where: { id: item.gearId },
                    data: {
                        availableQuantity: gear.availableQuantity + item.quantity,
                        isAvailable: true,
                    },
                });
            }
        }

        return tx.rentalOrder.update({
            where: { id: orderId },
            data: { status: "CANCELLED" },
            select: ORDER_SELECT,
        });
    });

    return updated;
};

export const markPickedUp = async (
    orderId: string,
    providerId: string,
) => {
    const order = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
    });

    if (!order) throw new NotFoundError("Order not found");
    if (order.providerId !== providerId) {
        throw new ForbiddenError("This order belongs to another provider");
    }
    if (order.status !== "PAID") {
        throw new BadRequestError(`Cannot mark as picked up with status: ${order.status}`);
    }

    return prisma.rentalOrder.update({
        where: { id: orderId },
        data: { status: "PICKED_UP" },
        select: ORDER_SELECT,
    });
};

export const markReturned = async (
    orderId: string,
    providerId: string,
) => {
    const order = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
    });

    if (!order) throw new NotFoundError("Order not found");
    if (order.providerId !== providerId) {
        throw new ForbiddenError("This order belongs to another provider");
    }
    if (order.status !== "PICKED_UP") {
        throw new BadRequestError(`Cannot mark as returned with status: ${order.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        const items = await tx.rentalOrderItem.findMany({
            where: { orderId },
        });

        for (const item of items) {
            const gear = await tx.gearItem.findUnique({
                where: { id: item.gearId },
            });
            if (!gear) continue;

            await tx.gearItem.update({
                where: { id: item.gearId },
                data: {
                    availableQuantity: gear.availableQuantity + item.quantity,
                    isAvailable: true,
                },
            });
        }

        return tx.rentalOrder.update({
            where: { id: orderId },
            data: { status: "RETURNED" },
            select: ORDER_SELECT,
        });
    });

    return updated;
};

export const getOrder = async (orderId: string, userId: string, role: string) => {
    const order = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
        select: ORDER_SELECT,
    });

    if (!order) throw new NotFoundError("Order not found");

    if (role === "CUSTOMER" && order.customerId !== userId) {
        throw new ForbiddenError("Access denied");
    }
    if (role === "PROVIDER" && order.providerId !== userId) {
        throw new ForbiddenError("Access denied");
    }

    return order;
};

export const getMyOrders = async (customerId: string, query: ListOrdersQuery) => {
    const { page, limit, skip } = parsePagination({
        page: query.page,
        limit: query.limit,
    });

    const where: Record<string, unknown> = { customerId };
    if (query.status) where.status = query.status;

    const [orders, total] = await Promise.all([
        prisma.rentalOrder.findMany({
            where,
            select: ORDER_SELECT,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.rentalOrder.count({ where }),
    ]);

    return { orders, meta: buildPaginationMeta(page, limit, total) };
};

export const getProviderOrders = async (
    providerId: string,
    query: ListOrdersQuery,
) => {
    const { page, limit, skip } = parsePagination({
        page: query.page,
        limit: query.limit,
    });

    const where: Record<string, unknown> = { providerId };
    if (query.status) where.status = query.status;

    const [orders, total] = await Promise.all([
        prisma.rentalOrder.findMany({
            where,
            select: ORDER_SELECT,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.rentalOrder.count({ where }),
    ]);

    return { orders, meta: buildPaginationMeta(page, limit, total) };
};

export const getAllOrders = async (query: AdminListOrdersQuery) => {
    const { page, limit, skip } = parsePagination({
        page: query.page,
        limit: query.limit,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.providerId) where.providerId = query.providerId;

    const [orders, total] = await Promise.all([
        prisma.rentalOrder.findMany({
            where,
            select: ORDER_SELECT,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.rentalOrder.count({ where }),
    ]);

    return { orders, meta: buildPaginationMeta(page, limit, total) };
};
