import { prisma } from "../../lib/prisma.js";
import {
    ConflictError,
    UnauthorizedError,
    NotFoundError,
    BadRequestError,
} from "../../utils/AppError.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateTokens, verifyRefreshToken } from "../../utils/jwt.js";
import type {
    RegisterInput,
    LoginInput,
    ChangePasswordInput,
} from "../../utils/validations/auth.validation.js";

export const register = async (data: RegisterInput) => {
    const existing = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existing) {
        throw new ConflictError("Email already registered");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            phone: data.phone ?? null,
            role: data.role,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
        },
    });

    if (data.role === "PROVIDER") {
        await prisma.providerProfile.create({
            data: {
                userId: user.id,
                shopName: `${user.name}'s Shop`,
            },
        });
    }

    const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return { user, ...tokens };
};

export const login = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status === "SUSPENDED") {
        throw new UnauthorizedError("Your account has been suspended");
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid email or password");
    }

    const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
};

export const refreshAccessToken = async (refreshToken: string) => {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedError("User not found or suspended");
    }

    const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return tokens;
};

export const changePassword = async (
    userId: string,
    data: ChangePasswordInput,
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
    });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    const isCurrentPasswordValid = await comparePassword(
        data.currentPassword,
        user.password,
    );

    if (!isCurrentPasswordValid) {
        throw new BadRequestError("Current password is incorrect");
    }

    if (data.currentPassword === data.newPassword) {
        throw new BadRequestError(
            "New password must be different from current password",
        );
    }

    const hashedPassword = await hashPassword(data.newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });
};
