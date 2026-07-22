import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "GearUp API",
            version: "1.0.0",
            description: "Role-based sports & outdoor equipment rental platform API",
        },
        servers: [
            { url: "http://localhost:8000/api/v1", name: "Development" },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        email: { type: "string", format: "email" },
                        phone: { type: "string", nullable: true },
                        role: { type: "string", enum: ["CUSTOMER", "PROVIDER", "ADMIN"] },
                        status: { type: "string", enum: ["ACTIVE", "SUSPENDED", "PENDING"] },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                Category: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        slug: { type: "string" },
                        description: { type: "string", nullable: true },
                        isActive: { type: "boolean" },
                    },
                },
                GearItem: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        slug: { type: "string" },
                        brand: { type: "string" },
                        dailyRentPrice: { type: "string" },
                        securityDeposit: { type: "string" },
                        stockQuantity: { type: "integer" },
                        availableQuantity: { type: "integer" },
                        condition: { type: "string", enum: ["NEW", "GOOD", "USED"] },
                        approvalStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                    },
                },
                RentalOrder: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        orderNumber: { type: "string" },
                        status: { type: "string", enum: ["PLACED", "CONFIRMED", "PAID", "PICKED_UP", "RETURNED", "CANCELLED", "REJECTED"] },
                        total: { type: "string" },
                        tax: { type: "string" },
                        securityDeposit: { type: "string" },
                        paymentStatus: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] },
                    },
                },
                Review: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        rating: { type: "integer", minimum: 1, maximum: 5 },
                        comment: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        statusCode: { type: "integer" },
                        message: { type: "string" },
                    },
                },
                PaginationMeta: {
                    type: "object",
                    properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                    },
                },
            },
        },
    },
    apis: ["./src/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
