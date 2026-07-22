import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { SUCCESS_MESSAGES } from "../../config/constants.js";
import * as reviewService from "./review.service.js";

export const create = async (req: Request, res: Response) => {
    const review = await reviewService.create(req.user!.userId, req.body);
    sendResponse(res, {
        statusCode: 201,
        message: SUCCESS_MESSAGES.REVIEW_CREATED,
        data: review,
    });
};

export const getGearReviews = async (req: Request, res: Response) => {
    const gearId = req.params.gearId as string;
    const result = await reviewService.getGearReviews(gearId, req.query as {
        page?: number;
        limit?: number;
    });
    sendResponse(res, {
        data: {
            reviews: result.reviews,
            averageRating: result.averageRating,
        },
        meta: result.meta,
    });
};

export const getMyReviews = async (req: Request, res: Response) => {
    const reviews = await reviewService.getMyReviews(req.user!.userId);
    sendResponse(res, { data: reviews });
};

export const deleteReview = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await reviewService.deleteReview(id, req.user!.userId);
    sendResponse(res, { message: "Review deleted successfully", data: null });
};
