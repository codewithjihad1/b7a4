import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
} from "../../utils/validations/auth.validation.js";
import * as authController from "./auth.controller.js";

const router = Router();

router.post(
    "/register",
    validate(registerSchema),
    catchAsync(authController.register),
);

router.post(
    "/login",
    validate(loginSchema),
    catchAsync(authController.login),
);

router.post(
    "/refresh-token",
    validate(refreshTokenSchema),
    catchAsync(authController.refreshToken),
);

router.post(
    "/change-password",
    authenticate,
    validate(changePasswordSchema),
    catchAsync(authController.changePassword),
);

export default router;
