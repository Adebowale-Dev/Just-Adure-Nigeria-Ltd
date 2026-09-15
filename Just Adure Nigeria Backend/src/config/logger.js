import pino from "pino";
import { env } from "./env.js";

const redaction = {
    paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers.set-cookie",
        "req.body",
        "req.query",
        "MONGODB_URL",
        "JWT_ACCESS_SECRET",
        "JWT_REFRESH_SECRET",
        "ADMIN_PASSWORD",
        "password",
        "token",
        "accessToken",
        "refreshToken",
        "PAYSTACK_SECRET_KEY",
        "BREVO_API_KEY",
        "CLOUDINARY_API_SECRET",
    ],
    censor: "[REDACTED]",
};

const developmentTransport = env.NODE_ENV === "development"
    ? {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            messageFormat: "{msg}",
        },
    }
    : undefined;

export const logger = pino({
    level: env.LOG_LEVEL,
    redact: redaction,
    transport: developmentTransport,
});
