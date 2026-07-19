export const SUCCESS_MESSAGES = {
    CREATED: "Resource created successfully",
    UPDATED: "Resource updated successfully",
    DELETED: "Resource deleted successfully",
    FETCHED: "Resource fetched successfully",
    LOGIN: "Login successful",
    REGISTER: "Registration successful",
    LOGOUT: "Logout successful",
    TOKEN_REFRESHED: "Token refreshed successfully",
    PASSWORD_CHANGED: "Password changed successfully",
    PROFILE_UPDATED: "Profile updated successfully",
    ORDER_PLACED: "Order placed successfully",
    ORDER_CONFIRMED: "Order confirmed successfully",
    ORDER_CANCELLED: "Order cancelled successfully",
    ORDER_REJECTED: "Order rejected successfully",
    PAYMENT_SUCCESS: "Payment successful",
    PAYMENT_FAILED: "Payment failed",
    REVIEW_CREATED: "Review created successfully",
    GEAR_APPROVED: "Gear approved successfully",
    GEAR_REJECTED: "Gear rejected successfully",
    USER_SUSPENDED: "User suspended successfully",
    USER_ACTIVATED: "User activated successfully",
} as const;

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
} as const;

export const RENTAL_STATUS_FLOW = [
    "PLACED",
    "CONFIRMED",
    "PAID",
    "PICKED_UP",
    "RETURNED",
] as const;

export const TAX_RATE = 0.1;
