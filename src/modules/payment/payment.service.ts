import { prisma } from "../../lib/prisma.js";
import { stripe } from "../../lib/stripe.js";
import {
    NotFoundError,
    BadRequestError,
    ForbiddenError,
} from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import type { CreatePaymentIntentInput } from "../../utils/validations/payment.validation.js";

const PAYMENT_SELECT = {
    id: true,
    customerId: true,
    transactionId: true,
    provider: true,
    method: true,
    amount: true,
    currency: true,
    status: true,
    paidAt: true,
    createdAt: true,
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripeResponseToJson = (data: unknown): any =>
    JSON.parse(JSON.stringify(data));

export const createPaymentIntent = async (
    customerId: string,
    data: CreatePaymentIntentInput,
) => {
    const order = await prisma.rentalOrder.findUnique({
        where: { id: data.orderId },
        select: {
            id: true,
            customerId: true,
            status: true,
            paymentStatus: true,
            total: true,
            orderNumber: true,
        },
    });

    if (!order) throw new NotFoundError("Order not found");
    if (order.customerId !== customerId) {
        throw new ForbiddenError("This order belongs to another customer");
    }
    if (order.status !== "CONFIRMED") {
        throw new BadRequestError(
            `Order must be confirmed before payment. Current status: ${order.status}`,
        );
    }
    if (order.paymentStatus === "SUCCESS") {
        throw new BadRequestError("Order is already paid");
    }

    const existingPending = await prisma.payment.findFirst({
        where: {
            orderId: data.orderId,
            status: "PENDING",
            provider: "STRIPE",
        },
    });

    if (existingPending && existingPending.transactionId) {
        try {
            const intent = await stripe.paymentIntents.retrieve(
                existingPending.transactionId,
            );
            if (intent.status === "requires_payment_method" || intent.status === "requires_confirmation") {
                return {
                    paymentId: existingPending.id,
                    clientSecret: intent.client_secret,
                    amount: order.total,
                    currency: "usd",
                };
            }
        } catch {
            // Intent may have expired, create a new one
        }
    }

    const amountInCents = Math.round(Number(order.total) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerId,
        },
    });

    const payment = await prisma.payment.create({
        data: {
            orderId: order.id,
            customerId,
            transactionId: paymentIntent.id,
            provider: "STRIPE",
            method: "card",
            amount: order.total,
            currency: "USD",
            status: "PENDING",
        },
        select: PAYMENT_SELECT,
    });

    return {
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret,
        amount: order.total,
        currency: "usd",
    };
};

export const handleStripeWebhook = async (
    body: Buffer,
    signature: string,
) => {
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            env.STRIPE_WEBHOOK_SECRET ?? "",
        );
    } catch (err) {
        logger.error({ err }, "Stripe webhook signature verification failed");
        throw new BadRequestError("Webhook signature verification failed");
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        if (!orderId) {
            logger.warn("Payment succeeded but no orderId in metadata");
            return { received: true };
        }

        await prisma.$transaction(async (tx) => {
            await tx.payment.updateMany({
                where: { transactionId: paymentIntent.id },
                data: {
                    status: "SUCCESS",
                    paidAt: new Date(),
                    gatewayResponse: stripeResponseToJson(paymentIntent),
                },
            });

            await tx.rentalOrder.update({
                where: { id: orderId },
                data: { paymentStatus: "SUCCESS", status: "PAID" },
            });
        });

        logger.info(
            { orderId, transactionId: paymentIntent.id },
            "Payment successful via Stripe webhook",
        );
    }

    if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object;

        await prisma.payment.updateMany({
            where: { transactionId: paymentIntent.id },
            data: {
                status: "FAILED",
                gatewayResponse: stripeResponseToJson(paymentIntent),
            },
        });

        logger.warn(
            { transactionId: paymentIntent.id },
            "Payment failed via Stripe webhook",
        );
    }

    return { received: true };
};

export const verifyPayment = async (paymentId: string, userId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
    });

    if (!payment) throw new NotFoundError("Payment not found");
    if (payment.customerId !== userId) {
        throw new ForbiddenError("Access denied");
    }

    if (payment.status === "PENDING" && payment.provider === "STRIPE") {
        try {
            const intent = await stripe.paymentIntents.retrieve(
                payment.transactionId,
            );

            if (intent.status === "succeeded") {
                await prisma.$transaction(async (tx) => {
                    await tx.payment.update({
                        where: { id: paymentId },
                        data: {
                            status: "SUCCESS",
                            paidAt: new Date(),
                            gatewayResponse: stripeResponseToJson(intent),
                        },
                    });

                    await tx.rentalOrder.update({
                        where: { id: payment.orderId },
                        data: { paymentStatus: "SUCCESS", status: "PAID" },
                    });
                });

                payment.status = "SUCCESS";
            } else if (intent.status === "canceled") {
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: "FAILED",
                        gatewayResponse: stripeResponseToJson(intent),
                    },
                });

                payment.status = "FAILED";
            }
        } catch (err) {
            logger.error({ err }, "Error verifying Stripe payment");
        }
    }

    return payment;
};

export const getPaymentByOrder = async (orderId: string, _userId: string) => {
    const payments = await prisma.payment.findMany({
        where: { orderId },
        select: {
            id: true,
            transactionId: true,
            provider: true,
            method: true,
            amount: true,
            currency: true,
            status: true,
            paidAt: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    if (payments.length === 0) {
        throw new NotFoundError("No payments found for this order");
    }

    return payments;
};

export const generateReceipt = async (paymentId: string, userId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: {
            ...PAYMENT_SELECT,
            order: {
                select: {
                    id: true,
                    orderNumber: true,
                    rentalStartDate: true,
                    rentalEndDate: true,
                    subtotal: true,
                    tax: true,
                    securityDeposit: true,
                    discount: true,
                    total: true,
                    customer: { select: { name: true, email: true } },
                    provider: {
                        select: {
                            name: true,
                            providerProfile: { select: { shopName: true } },
                        },
                    },
                    items: {
                        select: {
                            quantity: true,
                            dailyPrice: true,
                            days: true,
                            subtotal: true,
                            gear: { select: { title: true } },
                        },
                    },
                },
            },
        },
    });

    if (!payment) throw new NotFoundError("Payment not found");
    if (payment.customerId !== userId) {
        throw new ForbiddenError("Access denied");
    }
    if (payment.status !== "SUCCESS") {
        throw new BadRequestError("Receipt available only for successful payments");
    }

    return {
        receipt: {
            paymentId: payment.id,
            transactionId: payment.transactionId,
            method: payment.method,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.paidAt,
            order: {
                orderNumber: payment.order.orderNumber,
                rentalStartDate: payment.order.rentalStartDate,
                rentalEndDate: payment.order.rentalEndDate,
                subtotal: payment.order.subtotal,
                tax: payment.order.tax,
                securityDeposit: payment.order.securityDeposit,
                discount: payment.order.discount,
                total: payment.order.total,
                customer: payment.order.customer,
                provider: {
                    name: payment.order.provider.name,
                    shopName: payment.order.provider.providerProfile?.shopName,
                },
                items: payment.order.items,
            },
        },
    };
};
