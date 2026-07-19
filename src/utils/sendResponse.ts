import type { Response } from "express";
import { HTTP_STATUS } from "../config/constants.js";

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface SendSuccessOptions<T> {
    statusCode?: number;
    message?: string;
    data: T;
    meta?: PaginationMeta;
}

export const sendResponse = <T>(
    res: Response,
    options: SendSuccessOptions<T>,
) => {
    const { statusCode = HTTP_STATUS.OK, message = "Success", data, meta } = options;

    const response: Record<string, unknown> = {
        success: true,
        statusCode,
        message,
        data,
    };

    if (meta) {
        response.meta = meta;
    }

    res.status(statusCode).json(response);
};
