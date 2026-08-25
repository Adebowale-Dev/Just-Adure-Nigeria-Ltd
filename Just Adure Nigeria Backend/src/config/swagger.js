import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";
export const openApiDocument = swaggerJsdoc({
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Just Adure Nigeria Ltd API",
            version: "0.1.0",
            description: "REST API for the placeholder-branded UK-used products marketplace.",
        },
        servers: [{ url: env.API_URL, description: env.NODE_ENV }],
        tags: [
            { name: "System", description: "Service health and readiness" },
            { name: "Authentication", description: "Customer and staff authentication" },
            { name: "Account", description: "Customer profile and saved delivery addresses" },
            { name: "Admin", description: "Protected administration dashboard and management endpoints" },
            { name: "Catalogue", description: "Public products, categories, brands and condition grades" },
            { name: "Cart", description: "Guest and customer shopping cart" },
            { name: "Wishlist", description: "Saved customer products and move-to-cart actions" },
            { name: "Newsletter", description: "Newsletter subscriptions and customer marketing opt-ins" },
            { name: "Checkout", description: "Delivery fee, pending orders, and inventory reservation" },
            { name: "Orders", description: "Customer order history and tracking" },
            { name: "Payments", description: "Paystack integration endpoints" },
        ],
        components: {
            schemas: {
                ApiError: {
                    type: "object",
                    required: ["error", "requestId"],
                    properties: {
                        error: {
                            type: "object",
                            required: ["code", "message"],
                            properties: {
                                code: { type: "string" },
                                message: { type: "string" },
                                fields: { type: "object", additionalProperties: true },
                            },
                        },
                        requestId: { type: "string" },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/**/*.js"],
});


