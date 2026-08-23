import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "PAYSTACK_SECRET_KEY",
      "BREVO_API_KEY",
      "CLOUDINARY_API_SECRET",
    ],
    censor: "[REDACTED]",
  },
});
