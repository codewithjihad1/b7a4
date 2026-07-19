import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            ...(err instanceof AppError && "errors" in err
                ? { errors: (err as { errors: Record<string, string[]> }).errors }
                : {}),
        });
        return;
    }

    logger.error({ err }, "Unhandled error");

    res.status(500).json({
        success: false,
        statusCode: 500,
        message:
            env.NODE_ENV === "production"
                ? "Internal server error"
                : err.message,
    });
};
