import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";
export const openApiDocument = swaggerJsdoc({
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Just Adure Nigeria Ltd API",
            version: "0.1.0",
            description: [
                "The API behind the Just Adure storefront and admin workspace.",
                "",
                "Start with **Catalogue** to browse products, **Cart** to prepare a purchase, then **Checkout** and **Payments** to complete it.",
                "Customer account endpoints require a signed-in customer. Admin endpoints require an authorized staff account.",
                "All successful responses place their result in `data`. Errors include a plain-language message and a `requestId` for support and debugging.",
            ].join("\n"),
        },
        servers: [{ url: env.API_URL, description: env.NODE_ENV }],
        tags: [
            { name: "System", description: "Check whether the API and database are available." },
            { name: "Authentication", description: "Create an account, sign in, sign out, and recover account access." },
            { name: "Account", description: "Manage the signed-in customer's profile and delivery addresses." },
            { name: "Admin", description: "Run the store: products, stock, orders, customers, support, content, and reports. Staff access is required." },
            { name: "Catalogue", description: "Browse searchable public products, categories, brands, and condition grades." },
            { name: "Cart", description: "Add, update, remove, or review products before checkout. Works for guests and customers." },
            { name: "Wishlist", description: "Save products for later, move them to the cart, or request a restock alert. Customer login is required." },
            { name: "Newsletter", description: "Subscribe to or leave product and restock updates." },
            { name: "Checkout", description: "Calculate delivery cost and create an order using prices and stock verified by the server." },
            { name: "Orders", description: "View, cancel, or track customer orders." },
            { name: "Payments", description: "Start and verify secure Paystack payments. The backend confirms the final payment status." },
        ],
        components: {
            securitySchemes: {
                cookieSession: {
                    type: "apiKey",
                    in: "cookie",
                    name: "access_token",
                    description: "Created automatically after a successful login. Browser requests send this secure cookie for you.",
                },
            },
            schemas: {
                PublicUser: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "66f20f55c7d7a984e8d50a10" },
                        name: { type: "string", example: "Demo Customer" },
                        email: { type: "string", format: "email", example: "customer@gmail.com" },
                        phone: { type: "string", example: "08000000002" },
                        roles: { type: "array", items: { type: "string" }, example: ["customer"] },
                        permissions: { type: "array", items: { type: "string" }, example: [] },
                        emailVerifiedAt: { type: "string", nullable: true, example: null },
                    },
                },
                EmailRequest: {
                    type: "object",
                    required: ["email"],
                    properties: {
                        email: { type: "string", format: "email", example: "customer@gmail.com" },
                    },
                },
                MessageResponse: {
                    type: "object",
                    properties: {
                        data: {
                            type: "object",
                            properties: {
                                message: { type: "string", example: "Request completed successfully." },
                            },
                        },
                    },
                },                ApiError: {
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




function jsonResponse(description = "Successful response", example = { data: {} }) {
    return {
        description,
        content: {
            "application/json": {
                schema: { type: "object" },
                example,
            },
        },
    };
}

function body(schema, example) {
    return {
        required: true,
        content: {
            "application/json": {
                schema,
                example,
            },
        },
    };
}

const idParam = (name, description) => ({ name, in: "path", required: true, description, schema: { type: "string" } });
const queryParam = (name, description, example) => ({ name, in: "query", required: false, description, schema: { type: "string", example } });

const requestBodies = {
    "POST /api/v1/wishlist/items": body({ type: "object", required: ["productId"], properties: { productId: { type: "string" }, notifyWhenAvailable: { type: "boolean" } } }, { productId: "66f20f55c7d7a984e8d50a21", notifyWhenAvailable: true }),
    "POST /api/v1/wishlist/items/{productId}/move-to-cart": body({ type: "object", properties: { quantity: { type: "number" } } }, { quantity: 1 }),
    "POST /api/v1/support/contact": body({ type: "object", required: ["type", "name", "email", "subject", "message"], properties: { type: { type: "string" }, name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, subject: { type: "string" }, orderNumber: { type: "string" }, productSlug: { type: "string" }, message: { type: "string" } } }, { type: "contact", name: "Demo Customer", email: "customer@gmail.com", phone: "08000000002", subject: "Product enquiry", productSlug: "apple-desktop-computer-uk-used", message: "Is this item still available?" }),
    "POST /api/v1/support/tickets/reply": body({ type: "object", required: ["ticketNumber", "email", "message"], properties: { ticketNumber: { type: "string" }, email: { type: "string" }, name: { type: "string" }, message: { type: "string" } } }, { ticketNumber: "TKT-20260828-001", email: "customer@gmail.com", message: "Thank you, I am still interested." }),
    "POST /api/v1/stock-alerts": body({ type: "object", required: ["productId", "email"], properties: { productId: { type: "string" }, email: { type: "string" }, name: { type: "string" } } }, { productId: "66f20f55c7d7a984e8d50a21", email: "customer@gmail.com", name: "Demo Customer" }),
    "POST /api/v1/products/{productId}/reviews": body({ type: "object", required: ["rating", "title", "comment"], properties: { rating: { type: "number" }, title: { type: "string" }, comment: { type: "string" }, imageUrl: { type: "string" } } }, { rating: 5, title: "Good product", comment: "The product matched the condition described." }),
    "POST /api/v1/orders/{orderId}/returns": body({ type: "object", required: ["reason", "details", "items"], properties: { reason: { type: "string" }, details: { type: "string" }, items: { type: "array", items: { type: "object" } } } }, { reason: "not_as_described", details: "The item condition is different from the listing.", items: [{ productId: "66f20f55c7d7a984e8d50a21", quantity: 1 }] }),
    "POST /api/v1/webhooks/paystack": body({ type: "object", description: "Raw Paystack webhook payload. Signature must be sent in x-paystack-signature header." }, { event: "charge.success", data: { reference: "JAD-ORDER-REFERENCE", amount: 32000000, currency: "NGN" } }),
    "POST /api/v1/payments/paystack/initialize": body({ type: "object", required: ["orderId"], properties: { orderId: { type: "string" } } }, { orderId: "66f20f55c7d7a984e8d50a31" }),
    "PATCH /api/v1/orders/my/{orderId}/cancel": body({ type: "object", properties: { reason: { type: "string" } } }, { reason: "Customer changed mind before processing." }),
    "PATCH /api/v1/notifications/{id}/read": body({ type: "object", properties: { read: { type: "boolean" } } }, { read: true }),
    "POST /api/v1/newsletter/subscribe": body({ type: "object", required: ["email"], properties: { email: { type: "string" }, name: { type: "string" } } }, { email: "customer@gmail.com", name: "Demo Customer" }),
    "POST /api/v1/checkout/delivery-fee": body({ type: "object", required: ["state", "city"], properties: { state: { type: "string" }, city: { type: "string" } } }, { state: "Lagos", city: "Ikeja" }),
    "POST /api/v1/checkout": body({ type: "object", required: ["customer", "deliveryAddress", "deliveryMethod"], properties: { customer: { type: "object" }, deliveryAddress: { type: "object" }, deliveryMethod: { type: "string" }, couponCode: { type: "string" }, notes: { type: "string" } } }, { customer: { name: "Demo Customer", email: "customer@gmail.com", phone: "08000000002" }, deliveryAddress: { addressLine1: "12 Allen Avenue", state: "Lagos", city: "Ikeja" }, deliveryMethod: "delivery", couponCode: "WELCOME" }),
    "POST /api/v1/cart/items": body({ type: "object", required: ["productId", "quantity"], properties: { productId: { type: "string" }, quantity: { type: "number" } } }, { productId: "66f20f55c7d7a984e8d50a21", quantity: 1 }),
    "PATCH /api/v1/cart/items/{productId}": body({ type: "object", required: ["quantity"], properties: { quantity: { type: "number" } } }, { quantity: 2 }),
    "POST /api/v1/auth/resend-verification": body({ $ref: "#/components/schemas/EmailRequest" }, { email: "customer@gmail.com" }),
    "POST /api/v1/auth/verify-email": body({ type: "object", required: ["token"], properties: { token: { type: "string" } } }, { token: "email-verification-token-from-email" }),
    "PATCH /api/v1/account": body({ type: "object", properties: { name: { type: "string" }, phone: { type: "string" } } }, { name: "Demo Customer", phone: "08000000002" }),
    "POST /api/v1/account/addresses": body({ type: "object", required: ["label", "recipientName", "phone", "addressLine1", "state", "city"], properties: { label: { type: "string" }, recipientName: { type: "string" }, phone: { type: "string" }, addressLine1: { type: "string" }, addressLine2: { type: "string" }, state: { type: "string" }, city: { type: "string" }, deliveryInstructions: { type: "string" }, isDefault: { type: "boolean" } } }, { label: "Home", recipientName: "Demo Customer", phone: "08000000002", addressLine1: "12 Allen Avenue", state: "Lagos", city: "Ikeja", isDefault: true }),
    "PATCH /api/v1/account/addresses/{addressId}": body({ type: "object", properties: { label: { type: "string" }, recipientName: { type: "string" }, phone: { type: "string" }, addressLine1: { type: "string" }, state: { type: "string" }, city: { type: "string" }, isDefault: { type: "boolean" } } }, { label: "Office", addressLine1: "20 Marina Road", state: "Lagos", city: "Lagos Island", isDefault: false }),
    "POST /api/v1/admin/delivery-zones": body({ type: "object" }, { code: "lagos-mainland", name: "Lagos Mainland", state: "Lagos", cityPattern: "Ikeja|Yaba", feeKobo: 750000, minDeliveryDays: 1, maxDeliveryDays: 2, isActive: true }),
    "PATCH /api/v1/admin/delivery-zones/{id}": body({ type: "object" }, { feeKobo: 900000, isActive: true }),
    "PATCH /api/v1/admin/newsletter-subscribers/{id}": body({ type: "object", required: ["status"], properties: { status: { type: "string" } } }, { status: "subscribed" }),
    "PATCH /api/v1/admin/homepage-content": body({ type: "object" }, { heroTitle: "Buy trusted UK-used products in Nigeria", heroSubtitle: "Verified products with honest condition notes.", bannerTitle: "Fresh arrivals", bannerIsActive: true }),
    "PATCH /api/v1/admin/store-settings": body({ type: "object" }, { storeName: "Just Adure Nigeria Ltd", defaultCurrency: "NGN", phoneNumber: "08000000000", whatsappNumber: "08000000000" }),
    "POST /api/v1/admin/products": body({ type: "object" }, { name: "Apple Desktop Computer", slug: "apple-desktop-computer-uk-used", sku: "JAD-CMP-APL-DESK-001", brandId: "66f20f55c7d7a984e8d50a01", categoryId: "66f20f55c7d7a984e8d50a02", conditionGradeId: "66f20f55c7d7a984e8d50a03", priceKobo: 52000000, stockQuantity: 1, shortDescription: "Clean UK-used Apple desktop.", description: "Tested and ready for sale." }),
    "PATCH /api/v1/admin/products/{id}": body({ type: "object" }, { priceKobo: 50000000, stockQuantity: 1, isFeatured: true }),
    "POST /api/v1/admin/uploads/product-image": body({ type: "object", required: ["dataUri", "altText"], properties: { dataUri: { type: "string" }, altText: { type: "string" } } }, { dataUri: "data:image/png;base64,iVBORw0KGgo...", altText: "Actual photo of Apple Desktop Computer" }),
    "POST /api/v1/admin/products/{id}/images": body({ type: "object" }, { cloudinaryPublicId: "local/products/image.jpg", secureUrl: "http://localhost:4000/uploads/products/image.jpg", altText: "Actual product photo", isPrimary: true }),
    "PATCH /api/v1/admin/products/{id}/images/{publicId}/primary": body({ type: "object", properties: { isPrimary: { type: "boolean" } } }, { isPrimary: true }),
    "PATCH /api/v1/admin/products/{id}/stock": body({ type: "object", required: ["stockQuantity"], properties: { stockQuantity: { type: "number" }, lowStockThreshold: { type: "number" } } }, { stockQuantity: 3, lowStockThreshold: 1 }),
    "POST /api/v1/admin/coupons": body({ type: "object" }, { code: "WELCOME", name: "Welcome discount", type: "percentage", percentage: 10, minOrderAmountKobo: 5000000, isActive: true }),
    "PATCH /api/v1/admin/coupons/{id}": body({ type: "object" }, { isActive: false }),
    "PATCH /api/v1/admin/orders/{id}/status": body({ type: "object", required: ["status"], properties: { status: { type: "string" }, note: { type: "string" } } }, { status: "processing", note: "Order is being prepared." }),
    "PATCH /api/v1/admin/support-tickets/{id}": body({ type: "object" }, { status: "resolved", reply: "Thanks for contacting us.", internalNote: "Handled by support." }),
    "PATCH /api/v1/admin/returns/{id}": body({ type: "object" }, { status: "refunded", adminNote: "Refund processed manually.", refundAmountKobo: 12500000, refundReference: "RFND-001" }),
    "PATCH /api/v1/admin/reviews/{id}": body({ type: "object" }, { status: "approved", adminReply: "Thank you for your review." }),
    "POST /api/v1/admin/staff": body({ type: "object" }, { name: "Inventory Staff", email: "inventory@example.com", phone: "08000000003", password: "StrongPass123", roles: ["inventory_manager"], permissions: ["products:read", "inventory:manage"] }),
    "PATCH /api/v1/admin/staff/{id}": body({ type: "object" }, { isActive: true, permissions: ["orders:read"] }),
};

const listQueryParams = {
    "/api/v1/products": [queryParam("q", "Search by name, SKU, brand, model or description", "desktop"), queryParam("category", "Filter by category slug", "computers"), queryParam("brand", "Filter by brand slug", "dell"), queryParam("condition", "Filter by condition grade code", "excellent"), queryParam("sort", "Sort order", "newest"), queryParam("page", "Page number", "1"), queryParam("limit", "Items per page", "12")],
    "/api/v1/orders/track": [queryParam("orderNumber", "Order number", "JAD-20260828-001"), queryParam("email", "Customer email", "customer@gmail.com")],
    "/api/v1/support/tickets/lookup": [queryParam("ticketNumber", "Support ticket number", "TKT-20260828-001"), queryParam("email", "Customer email", "customer@gmail.com")],
    "/api/v1/admin/reports": [queryParam("range", "Report range: today, week, month or custom", "month"), queryParam("dateFrom", "Custom start date", "2026-08-01"), queryParam("dateTo", "Custom end date", "2026-08-28"), queryParam("orderStatus", "Filter by order status", "paid"), queryParam("paymentStatus", "Filter by payment status", "successful")],
    "/api/v1/admin/reports/orders.csv": [queryParam("range", "Report range", "month"), queryParam("paymentStatus", "Filter by payment status", "successful")],
    "/api/v1/admin/reports/payments.csv": [queryParam("range", "Report range", "month"), queryParam("paymentStatus", "Filter by payment status", "successful")],
};

function enhanceOpenApiDocument(document) {
    for (const [pathName, methods] of Object.entries(document.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
            const key = `${method.toUpperCase()} ${pathName}`;
            const params = [];
            for (const match of pathName.matchAll(/\{([^}]+)\}/g)) {
                params.push(idParam(match[1], `${match[1]} value`));
            }
            if (listQueryParams[pathName]) params.push(...listQueryParams[pathName]);
            if (params.length) operation.parameters = [...(operation.parameters ?? []), ...params.filter((param) => !(operation.parameters ?? []).some((existing) => existing.name === param.name && existing.in === param.in))];
            if (!operation.requestBody && requestBodies[key]) operation.requestBody = requestBodies[key];
            for (const [statusCode, response] of Object.entries(operation.responses ?? {})) {
                if (!response.content && statusCode !== "204") {
                    operation.responses[statusCode] = jsonResponse(response.description, { data: { message: response.description } });
                }
            }
            if (!operation.responses?.default) {
                operation.responses = {
                    ...operation.responses,
                    default: {
                        description: "Error response",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ApiError" },
                            },
                        },
                    },
                };
            }
            if (!operation.description) {
                const access = operation.tags?.includes("Admin")
                    ? "Requires an authorized staff session."
                    : ["Account", "Wishlist"].some((tag) => operation.tags?.includes(tag))
                        ? "Requires a signed-in customer session."
                        : "See the response examples below for the returned data.";
                operation.description = `${operation.summary}. ${access}`;
            }
        }
    }
    return document;
}

enhanceOpenApiDocument(openApiDocument);

