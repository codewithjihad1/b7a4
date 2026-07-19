import type { Request, Response, NextFunction } from "express";
import { NotFoundError } from "../utils/AppError.js";

export const notFoundHandler = (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};
