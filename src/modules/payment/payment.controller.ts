import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { SUCCESS_MESSAGES } from "../../config/constants.js";
import * as paymentService from "./payment.service.js";

export const createPaymentIntent = async (req: Request, res: Response) => {
    const result = await paymentService.createPaymentIntent(
        req.user!.userId,
        req.body,
    );
    sendResponse(res, {
        message: "Payment intent created",
        data: result,
    });
};

export const stripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    const result = await paymentService.handleStripeWebhook(
        req.body,
        signature,
    );
    res.json(result);
};

export const verifyPayment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const payment = await paymentService.verifyPayment(id, req.user!.userId);
    sendResponse(res, { data: payment });
};

export const getPaymentByOrder = async (req: Request, res: Response) => {
    const orderId = req.params.orderId as string;
    const payments = await paymentService.getPaymentByOrder(
        orderId,
        req.user!.userId,
    );
    sendResponse(res, { data: payments });
};

export const generateReceipt = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await paymentService.generateReceipt(id, req.user!.userId);
    sendResponse(res, {
        message: "Receipt generated",
        data: result,
    });
};
