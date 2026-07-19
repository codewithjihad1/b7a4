import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import { updateProfileSchema } from "../../utils/validations/user.validation.js";
import * as userController from "./user.controller.js";

const router = Router();

router.get("/profile", authenticate, catchAsync(userController.getProfile));

router.patch(
    "/profile",
    authenticate,
    validate(updateProfileSchema),
    catchAsync(userController.updateProfile),
);

export default router;
