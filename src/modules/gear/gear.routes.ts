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

// Public
router.get("/", validate(browseGearSchema), catchAsync(gearController.browse));
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
