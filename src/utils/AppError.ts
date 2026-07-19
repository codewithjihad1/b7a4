import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../config/constants.js";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        isOperational: boolean = true,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = "Bad request") {
        super(message, HTTP_STATUS.BAD_REQUEST);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized") {
        super(message, HTTP_STATUS.UNAUTHORIZED);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden") {
        super(message, HTTP_STATUS.FORBIDDEN);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, HTTP_STATUS.NOT_FOUND);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Resource already exists") {
        super(message, HTTP_STATUS.CONFLICT);
    }
}

export class ValidationError extends AppError {
    public readonly errors: Record<string, string[]>;

    constructor(
        errors: Record<string, string[]>,
        message: string = "Validation failed",
    ) {
        super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        this.errors = errors;
    }
}
