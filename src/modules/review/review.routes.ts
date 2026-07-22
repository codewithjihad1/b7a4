import { Router } from "express";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import {
    createReviewSchema,
    getGearReviewsSchema,
} from "../../utils/validations/review.validation.js";
import * as reviewController from "./review.controller.js";

const router = Router();

// Public
router.get(
    "/gear/:gearId",
    validate(getGearReviewsSchema),
    catchAsync(reviewController.getGearReviews),
);

// Customer
router.post(
    "/",
    authenticate,
    validate(createReviewSchema),
    catchAsync(reviewController.create),
);

router.get(
    "/my-reviews",
    authenticate,
    catchAsync(reviewController.getMyReviews),
);

router.delete(
    "/:id",
    authenticate,
    validate(
        z.object({ params: z.object({ id: z.string().uuid() }) }),
    ),
    catchAsync(reviewController.deleteReview),
);

export default router;
