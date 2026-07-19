import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/AppError.js";
import { prisma } from "../lib/prisma.js";

export interface AuthUser {
    userId: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("No token provided");
        }

        const parts = authHeader.split(" ");
        const token = parts[1]!;

        const decoded = verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, status: true },
        });

        if (!user || user.status !== "ACTIVE") {
            throw new UnauthorizedError("User not found or suspended");
        }

        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new UnauthorizedError("Not authenticated"));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new UnauthorizedError(
                    "You do not have permission to access this resource",
                ),
            );
        }

        next();
    };
};
