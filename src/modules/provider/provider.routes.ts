import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { updateProviderProfileSchema } from "../../utils/validations/provider.validation.js";
import * as providerController from "./provider.controller.js";

const router = Router();

router.get(
    "/me",
    authenticate,
    authorize("PROVIDER"),
    catchAsync(providerController.getMyProfile),
);

router.patch(
    "/me",
    authenticate,
    authorize("PROVIDER"),
    validate(updateProviderProfileSchema),
    catchAsync(providerController.updateProfile),
);

router.get(
    "/dashboard",
    authenticate,
    authorize("PROVIDER"),
    catchAsync(providerController.getDashboard),
);

router.get(
    "/:id",
    catchAsync(providerController.getPublicProfile),
);

export default router;
