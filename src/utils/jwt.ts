import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload as object, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload as object, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
        throw new AppError("Invalid or expired access token", 401);
    }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
        throw new AppError("Invalid or expired refresh token", 401);
    }
};

export const generateTokens = (payload: TokenPayload) => {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};
