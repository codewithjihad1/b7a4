import { Router } from "express";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { upload } from "../../middlewares/upload.js";
import * as uploadController from "./upload.controller.js";

const router = Router();

router.post(
    "/image",
    authenticate,
    authorize("PROVIDER", "ADMIN"),
    upload.single("file"),
    catchAsync(uploadController.uploadImage),
);

router.delete(
    "/image",
    authenticate,
    authorize("PROVIDER", "ADMIN"),
    validate(
        z.object({
            body: z.object({
                publicId: z.string().min(1, "Public ID is required"),
            }),
        }),
    ),
    catchAsync(uploadController.deleteImage),
);

export default router;
