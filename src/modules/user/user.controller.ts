import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import * as userService from "./user.service.js";

export const getProfile = async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.user!.userId);
    sendResponse(res, { data: user });
};

export const updateProfile = async (req: Request, res: Response) => {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    sendResponse(res, { message: "Profile updated successfully", data: user });
};
