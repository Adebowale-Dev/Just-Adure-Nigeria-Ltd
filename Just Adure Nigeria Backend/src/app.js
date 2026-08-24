import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { openApiDocument } from "./config/swagger.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestContext } from "./middleware/request-context.js";
import { authRouter } from "./routes/auth.js";
import { catalogueRouter } from "./routes/catalogue.js";
import { cartRouter } from "./routes/cart.js";
import { checkoutRouter } from "./routes/checkout.js";
import { paystackWebhookRouter } from "./routes/paystack-webhook.js";
import { systemRouter } from "./routes/system.js";
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestContext);
app.use(pinoHttp({
    logger,
    autoLogging: env.NODE_ENV !== "test",
    customProps: (_request, response) => ({
        requestId: response.locals.requestId,
    }),
}));
app.use(helmet());
app.use(cors({
    origin: env.WEB_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "Idempotency-Key", "X-Request-ID"],
}));
// The webhook route must retain the exact bytes used to compute Paystack's signature.
app.use("/api/v1/webhooks/paystack", express.raw({ type: "application/json", limit: "256kb" }), paystackWebhookRouter);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "64kb" }));
app.use(cookieParser());
app.use("/api/v1", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === "test" ? 10_000 : 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again shortly.",
        },
    },
}));
app.use(systemRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", catalogueRouter);
app.use("/api/v1", cartRouter);
app.use("/api/v1", checkoutRouter);
app.get("/api/openapi.json", (_request, response) => response.json(openApiDocument));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    customSiteTitle: "Just Adure Nigeria Ltd API",
    customCss: ".swagger-ui .topbar { display: none }",
}));
app.use(notFoundHandler);
app.use(errorHandler);

