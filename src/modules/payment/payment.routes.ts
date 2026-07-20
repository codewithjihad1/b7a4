import { Router, raw } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import { createPaymentIntentSchema } from "../../utils/validations/payment.validation.js";
import * as paymentController from "./payment.controller.js";

const router = Router();

// Stripe webhook — must use raw body for signature verification
router.post(
    "/webhook/stripe",
    raw({ type: "application/json" }),
    catchAsync(paymentController.stripeWebhook),
);

// Authenticated routes
router.post(
    "/create-intent",
    authenticate,
    validate(createPaymentIntentSchema),
    catchAsync(paymentController.createPaymentIntent),
);

router.get(
    "/verify/:id",
    authenticate,
    catchAsync(paymentController.verifyPayment),
);

router.get(
    "/order/:orderId",
    authenticate,
    catchAsync(paymentController.getPaymentByOrder),
);

router.get(
    "/receipt/:id",
    authenticate,
    catchAsync(paymentController.generateReceipt),
);

export default router;
