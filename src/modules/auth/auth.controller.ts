import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { SUCCESS_MESSAGES } from "../../config/constants.js";
import * as authService from "./auth.service.js";

export const register = async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    sendResponse(res, {
        statusCode: 201,
        message: SUCCESS_MESSAGES.REGISTER,
        data: result,
    });
};

export const login = async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    sendResponse(res, {
        message: SUCCESS_MESSAGES.LOGIN,
        data: result,
    });
};

export const refreshToken = async (req: Request, res: Response) => {
    const result = await authService.refreshAccessToken(
        req.body.refreshToken,
    );
    sendResponse(res, {
        message: SUCCESS_MESSAGES.TOKEN_REFRESHED,
        data: result,
    });
};

export const changePassword = async (req: Request, res: Response) => {
    await authService.changePassword(req.user!.userId, req.body);
    sendResponse(res, {
        message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
        data: null,
    });
};
