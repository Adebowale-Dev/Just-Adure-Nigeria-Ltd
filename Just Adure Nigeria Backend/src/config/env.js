import "dotenv/config";
import { z } from "zod";
const environmentSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    API_URL: z.string().url().default("http://localhost:4000"),
    WEB_URL: z.string().url().default("http://localhost:3000"),
    MONGODB_URL: z.string().trim().refine((value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"), "Enter a valid MongoDB connection string.").default("mongodb://localhost:27017/just_adure"),
    LOG_LEVEL: z
        .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
        .default("info"),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    STOCK_RESERVATION_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
    PAYSTACK_PUBLIC_KEY: z.string().min(1),
    PAYSTACK_SECRET_KEY: z.string().min(1),
    BREVO_API_KEY: z.string().min(1),
    BREVO_SENDER_EMAIL: z.string().email(),
    BREVO_SENDER_NAME: z.string().min(1),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().trim().min(1).optional(),
});
const parsed = environmentSchema.safeParse(process.env);
if (!parsed.success) {
    const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
        .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
}
export const env = parsed.data;
