import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ValidationError } from "../utils/AppError.js";

export const validate = (
    schema: z.ZodObject<{
        body?: z.ZodTypeAny;
        query?: z.ZodTypeAny;
        params?: z.ZodTypeAny;
    }>,
) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            throw new ValidationError(fieldErrors);
        }

        const data = result.data as {
            body?: unknown;
            query?: unknown;
            params?: unknown;
        };

        if (data.body !== undefined) req.body = data.body;
        // Express 5 makes req.query and req.params read-only getters,
        // so we only validate them (throw on bad input) without reassigning.

        next();
    };
};
