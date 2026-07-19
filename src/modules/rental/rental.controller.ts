import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { SUCCESS_MESSAGES } from "../../config/constants.js";
import * as rentalService from "./rental.service.js";

export const placeOrder = async (req: Request, res: Response) => {
    const order = await rentalService.placeOrder(req.user!.userId, req.body);
    sendResponse(res, {
        statusCode: 201,
        message: SUCCESS_MESSAGES.ORDER_PLACED,
        data: order,
    });
};

export const confirmOrder = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const order = await rentalService.confirmOrder(id, req.user!.userId);
    sendResponse(res, {
        message: SUCCESS_MESSAGES.ORDER_CONFIRMED,
        data: order,
    });
};

export const rejectOrder = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const order = await rentalService.rejectOrder(id, req.user!.userId);
    sendResponse(res, {
        message: SUCCESS_MESSAGES.ORDER_REJECTED,
        data: order,
    });
};

export const cancelOrder = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const order = await rentalService.cancelOrder(id, req.user!.userId);
    sendResponse(res, {
        message: SUCCESS_MESSAGES.ORDER_CANCELLED,
        data: order,
    });
};

export const markPickedUp = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const order = await rentalService.markPickedUp(id, req.user!.userId);
    sendResponse(res, {
        message: "Gear marked as picked up",
        data: order,
    });
};

export const markReturned = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const order = await rentalService.markReturned(id, req.user!.userId);
    sendResponse(res, {
        message: "Gear marked as returned",
        data: order,
    });
};

export const getOrder = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const order = await rentalService.getOrder(
        id,
        req.user!.userId,
        req.user!.role,
    );
    sendResponse(res, { data: order });
};

export const getMyOrders = async (req: Request, res: Response) => {
    const result = await rentalService.getMyOrders(
        req.user!.userId,
        req.query as Parameters<typeof rentalService.getMyOrders>[1],
    );
    sendResponse(res, { data: result.orders, meta: result.meta });
};

export const getProviderOrders = async (req: Request, res: Response) => {
    const result = await rentalService.getProviderOrders(
        req.user!.userId,
        req.query as Parameters<typeof rentalService.getProviderOrders>[1],
    );
    sendResponse(res, { data: result.orders, meta: result.meta });
};

export const getAllOrders = async (req: Request, res: Response) => {
    const result = await rentalService.getAllOrders(
        req.query as Parameters<typeof rentalService.getAllOrders>[0],
    );
    sendResponse(res, { data: result.orders, meta: result.meta });
};
