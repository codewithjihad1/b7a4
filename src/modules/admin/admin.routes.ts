import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
    listUsersSchema,
    userIdParamSchema,
    updateUserRoleSchema,
    updateUserStatusSchema,
    listPendingGearSchema,
    gearIdParamSchema,
    listAllOrdersSchema,
    dashboardStatsSchema,
} from "../../utils/validations/admin.validation.js";
import * as adminController from "./admin.controller.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

// Dashboard
router.get(
    "/dashboard",
    validate(dashboardStatsSchema),
    catchAsync(adminController.getDashboard),
);

// ── User Management ──
router.get("/users", validate(listUsersSchema), catchAsync(adminController.listUsers));
router.get("/users/:id", validate(userIdParamSchema), catchAsync(adminController.getUserById));
router.patch(
    "/users/:id/role",
    validate(userIdParamSchema.merge(updateUserRoleSchema)),
    catchAsync(adminController.updateUserRole),
);
router.patch(
    "/users/:id/status",
    validate(userIdParamSchema.merge(updateUserStatusSchema)),
    catchAsync(adminController.updateUserStatus),
);

// ── Gear Moderation ──
router.get("/gear", validate(listPendingGearSchema), catchAsync(adminController.listGear));
router.get("/gear/:id", validate(gearIdParamSchema), catchAsync(adminController.getGearById));

// ── Rental Monitoring ──
router.get("/rentals", validate(listAllOrdersSchema), catchAsync(adminController.listOrders));
router.get(
    "/rentals/:id",
    validate(userIdParamSchema),
    catchAsync(adminController.getOrderById),
);

export default router;
