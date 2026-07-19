import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import * as gearService from "./gear.service.js";

export const create = async (req: Request, res: Response) => {
    const gear = await gearService.create(req.user!.userId, req.body);
    sendResponse(res, {
        statusCode: 201,
        message: "Gear item created successfully",
        data: gear,
    });
};

export const update = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const gear = await gearService.update(id, req.user!.userId, req.body);
    sendResponse(res, {
        message: "Gear item updated successfully",
        data: gear,
    });
};

export const remove = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await gearService.remove(id, req.user!.userId);
    sendResponse(res, {
        message: "Gear item deleted successfully",
        data: null,
    });
};

export const getById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const gear = await gearService.getById(id);
    sendResponse(res, { data: gear });
};

export const browse = async (req: Request, res: Response) => {
    const result = await gearService.browse(
        req.query as Parameters<typeof gearService.browse>[0],
    );
    sendResponse(res, {
        data: result.items,
        meta: result.meta,
    });
};

export const getProviderGear = async (req: Request, res: Response) => {
    const items = await gearService.getProviderGear(req.user!.userId);
    sendResponse(res, { data: items });
};

export const moderate = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const gear = await gearService.moderate(id, req.body);
    sendResponse(res, {
        message: "Gear moderation status updated",
        data: gear,
    });
};

export const getAllAdmin = async (_req: Request, res: Response) => {
    const items = await gearService.getAllAdmin();
    sendResponse(res, { data: items });
};

export const updateStock = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const gear = await gearService.updateStock(
        id,
        req.user!.userId,
        req.body.availableQuantity,
    );
    sendResponse(res, {
        message: "Stock updated successfully",
        data: gear,
    });
};
