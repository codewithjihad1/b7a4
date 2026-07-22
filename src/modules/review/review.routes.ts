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

/**
 * @swagger
 * /reviews/gear/{gearId}:
 *   get:
 *     summary: Get reviews for a gear item (public)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: gearId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Reviews with average rating
 */
router.get(
    "/gear/:gearId",
    validate(getGearReviewsSchema),
    catchAsync(reviewController.getGearReviews),
);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a review (Customer only, order must be RETURNED)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, gearId, rating]
 *             properties:
 *               orderId: { type: string, format: uuid }
 *               gearId: { type: string, format: uuid }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Validation error or order not returned
 */
router.post(
    "/",
    authenticate,
    validate(createReviewSchema),
    catchAsync(reviewController.create),
);

/**
 * @swagger
 * /reviews/my-reviews:
 *   get:
 *     summary: Get current user's reviews
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get(
    "/my-reviews",
    authenticate,
    catchAsync(reviewController.getMyReviews),
);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete own review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Review deleted
 *       403:
 *         description: Not review owner
 */
router.delete(
    "/:id",
    authenticate,
    validate(
        z.object({ params: z.object({ id: z.string().uuid() }) }),
    ),
    catchAsync(reviewController.deleteReview),
);

export default router;
