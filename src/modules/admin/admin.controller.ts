import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../../config/constants.js";
import * as adminService from "./admin.service.js";

export const getDashboard = async (req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats(
        req.query.from as Date | undefined,
        req.query.to as Date | undefined,
    );
    sendResponse(res, { data: stats });
};

// ── User Management ──

export const listUsers = async (req: Request, res: Response) => {
    const result = await adminService.listUsers(req.query as any);
    sendResponse(res, { data: result.users, meta: result.meta });
};

export const getUserById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await adminService.getUserById(id);
    sendResponse(res, { data: user });
};

export const updateUserRole = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { role } = req.body as { role: "CUSTOMER" | "PROVIDER" | "ADMIN" };
    const user = await adminService.updateUserRole(id, role);
    sendResponse(res, { message: SUCCESS_MESSAGES.UPDATED, data: user });
};

export const updateUserStatus = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body as { status: "ACTIVE" | "SUSPENDED" | "PENDING" };
    const user = await adminService.updateUserStatus(id, status);
    sendResponse(res, { message: SUCCESS_MESSAGES.UPDATED, data: user });
};

// ── Gear Moderation ──

export const listGear = async (req: Request, res: Response) => {
    const result = await adminService.listGear(req.query as any);
    sendResponse(res, { data: result.items, meta: result.meta });
};

export const getGearById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const item = await adminService.getGearById(id);
    sendResponse(res, { data: item });
};

// ── Rental Monitoring ──

export const listOrders = async (req: Request, res: Response) => {
    const result = await adminService.listOrders(req.query as any);
    sendResponse(res, { data: result.orders, meta: result.meta });
};

export const getOrderById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const order = await adminService.getOrderById(id);
    sendResponse(res, { data: order });
};
