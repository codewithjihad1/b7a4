import cors from "cors";
import express, { raw } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import providerRoutes from "./modules/provider/provider.routes.js";
import gearRoutes from "./modules/gear/gear.routes.js";
import rentalRoutes from "./modules/rental/rental.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// Stripe webhook needs raw body — register BEFORE json middleware
app.use("/api/v1/payments/webhook", raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { success: false, message: "Too many requests, try again later" },
        standardHeaders: true,
        legacyHeaders: false,
    }),
);

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/providers", providerRoutes);
app.use("/api/v1/gear", gearRoutes);
app.use("/api/v1/rentals", rentalRoutes);
app.use("/api/v1/payments", paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
