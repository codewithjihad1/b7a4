import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
    createCategorySchema,
    updateCategorySchema,
    categoryIdParamSchema,
} from "../../utils/validations/category.validation.js";
import * as categoryController from "./category.controller.js";

const router = Router();

router.get("/", catchAsync(categoryController.getAll));
router.get(
    "/admin",
    authenticate,
    authorize("ADMIN"),
    catchAsync(categoryController.getAllAdmin),
);
router.get(
    "/:id",
    validate(categoryIdParamSchema),
    catchAsync(categoryController.getById),
);

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    validate(createCategorySchema),
    catchAsync(categoryController.create),
);
router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate(updateCategorySchema),
    catchAsync(categoryController.update),
);
router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate(categoryIdParamSchema),
    catchAsync(categoryController.remove),
);

export default router;
