import { Router } from "express";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
    createGearSchema,
    updateGearSchema,
    gearIdParamSchema,
    browseGearSchema,
    moderateGearSchema,
} from "../../utils/validations/gear.validation.js";
import * as gearController from "./gear.controller.js";

const router = Router();

/**
 * @swagger
 * /gear:
 *   get:
 *     summary: Browse gear (public)
 *     tags: [Gear]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: condition
 *         schema: { type: string, enum: [NEW, GOOD, USED] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [price_asc, price_desc, newest, rating] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of gear items
 */
router.get("/", validate(browseGearSchema), catchAsync(gearController.browse));

/**
 * @swagger
 * /gear/{id}:
 *   get:
 *     summary: Get gear by ID (public)
 *     tags: [Gear]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Gear details
 *       404:
 *         description: Gear not found
 */
router.get(
    "/:id",
    validate(gearIdParamSchema),
    catchAsync(gearController.getById),
);

// Provider
router.get(
    "/provider/mine",
    authenticate,
    authorize("PROVIDER"),
    catchAsync(gearController.getProviderGear),
);

/**
 * @swagger
 * /gear:
 *   post:
 *     summary: Create gear item (Provider only)
 *     tags: [Gear]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, categoryId, brand, description, dailyRentPrice, securityDeposit, stockQuantity, condition]
 *             properties:
 *               title: { type: string }
 *               categoryId: { type: string, format: uuid }
 *               brand: { type: string }
 *               description: { type: string }
 *               dailyRentPrice: { type: number }
 *               securityDeposit: { type: number }
 *               stockQuantity: { type: integer }
 *               condition: { type: string, enum: [NEW, GOOD, USED] }
 *     responses:
 *       201:
 *         description: Gear created
 *       401:
 *         description: Unauthorized
 */
router.post(
    "/",
    authenticate,
    authorize("PROVIDER"),
    validate(createGearSchema),
    catchAsync(gearController.create),
);

router.patch(
    "/:id",
    authenticate,
    authorize("PROVIDER"),
    validate(updateGearSchema),
    catchAsync(gearController.update),
);

router.delete(
    "/:id",
    authenticate,
    authorize("PROVIDER"),
    validate(gearIdParamSchema),
    catchAsync(gearController.remove),
);

router.patch(
    "/:id/stock",
    authenticate,
    authorize("PROVIDER"),
    validate(
        z.object({
            params: z.object({ id: z.string().uuid() }),
            body: z.object({
                availableQuantity: z.coerce.number().int().min(0),
            }),
        }),
    ),
    catchAsync(gearController.updateStock),
);

// Admin
router.get(
    "/admin/all",
    authenticate,
    authorize("ADMIN"),
    catchAsync(gearController.getAllAdmin),
);

router.patch(
    "/:id/moderate",
    authenticate,
    authorize("ADMIN"),
    validate(moderateGearSchema),
    catchAsync(gearController.moderate),
);

export default router;
