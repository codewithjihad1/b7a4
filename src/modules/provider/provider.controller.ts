import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import * as providerService from "./provider.service.js";

export const getMyProfile = async (req: Request, res: Response) => {
    const profile = await providerService.getMyProfile(req.user!.userId);
    sendResponse(res, { data: profile });
};

export const updateProfile = async (req: Request, res: Response) => {
    const profile = await providerService.updateProfile(
        req.user!.userId,
        req.body,
    );
    sendResponse(res, {
        message: "Provider profile updated successfully",
        data: profile,
    });
};

export const getPublicProfile = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const profile = await providerService.getPublicProfile(id);
    sendResponse(res, { data: profile });
};

export const getDashboard = async (req: Request, res: Response) => {
    const dashboard = await providerService.getDashboard(req.user!.userId);
    sendResponse(res, { data: dashboard });
};
