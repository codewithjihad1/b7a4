import { Router } from "express";
import { z } from "zod";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
    placeOrderSchema,
    orderIdParamSchema,
    listOrdersSchema,
    adminListOrdersSchema,
} from "../../utils/validations/rental.validation.js";
import * as rentalController from "./rental.controller.js";

const router = Router();

// Customer
router.post(
    "/",
    authenticate,
    authorize("CUSTOMER"),
    validate(placeOrderSchema),
    catchAsync(rentalController.placeOrder),
);

router.get(
    "/my-orders",
    authenticate,
    authorize("CUSTOMER"),
    validate(listOrdersSchema),
    catchAsync(rentalController.getMyOrders),
);

router.patch(
    "/:id/cancel",
    authenticate,
    authorize("CUSTOMER"),
    validate(orderIdParamSchema),
    catchAsync(rentalController.cancelOrder),
);

// Provider
router.get(
    "/provider/orders",
    authenticate,
    authorize("PROVIDER"),
    validate(listOrdersSchema),
    catchAsync(rentalController.getProviderOrders),
);

router.patch(
    "/:id/confirm",
    authenticate,
    authorize("PROVIDER"),
    validate(orderIdParamSchema),
    catchAsync(rentalController.confirmOrder),
);

router.patch(
    "/:id/reject",
    authenticate,
    authorize("PROVIDER"),
    validate(orderIdParamSchema),
    catchAsync(rentalController.rejectOrder),
);

router.patch(
    "/:id/pickup",
    authenticate,
    authorize("PROVIDER"),
    validate(orderIdParamSchema),
    catchAsync(rentalController.markPickedUp),
);

router.patch(
    "/:id/return",
    authenticate,
    authorize("PROVIDER"),
    validate(orderIdParamSchema),
    catchAsync(rentalController.markReturned),
);

// Admin
router.get(
    "/admin/all",
    authenticate,
    authorize("ADMIN"),
    validate(adminListOrdersSchema),
    catchAsync(rentalController.getAllOrders),
);

// Shared (customer/provider/admin — access control inside service)
router.get(
    "/:id",
    authenticate,
    validate(orderIdParamSchema),
    catchAsync(rentalController.getOrder),
);

export default router;
