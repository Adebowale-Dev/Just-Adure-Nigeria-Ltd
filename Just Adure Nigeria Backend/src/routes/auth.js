import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { authCookieNames, requireAuth } from "../middleware/auth.js";
import { User } from "../models/user.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/token.js";
export const authRouter = Router();
const nigerianPhoneSchema = z
    .string()
    .trim()
    .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number.");
const registerSchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().toLowerCase(),
    phone: nigerianPhoneSchema,
    password: z.string().min(8).max(128),
});
const loginSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1).max(128),
});
function authCookieOptions(maxAgeMs) {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: maxAgeMs,
        path: "/",
    };
}
function publicUser(user) {
    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        emailVerified: Boolean(user.emailVerifiedAt),
    };
}
function setAuthCookies(response, user) {
    const accessToken = signToken({ sub: String(user._id), type: "access", roles: user.roles }, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_TTL_MINUTES * 60);
    const refreshToken = signToken({ sub: String(user._id), type: "refresh", roles: user.roles }, env.JWT_REFRESH_SECRET, env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60);
    response.cookie(authCookieNames.access, accessToken, authCookieOptions(env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000));
    response.cookie(authCookieNames.refresh, refreshToken, authCookieOptions(env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000));
}
/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a customer account
 *     responses:
 *       201:
 *         description: Customer account created
 */
authRouter.post("/register", async (request, response, next) => {
    try {
        const input = registerSchema.parse(request.body);
        const existingUser = await User.findOne({ email: input.email }).lean();
        if (existingUser) {
            throw new AppError(409, "EMAIL_ALREADY_REGISTERED", "An account already exists with this email address.");
        }
        const user = await User.create({
            name: input.name,
            email: input.email,
            phone: input.phone,
            passwordHash: await hashPassword(input.password),
            roles: ["customer"],
        });
        setAuthCookies(response, user);
        response.status(201).json({ data: { user: publicUser(user) } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in with email and password
 *     responses:
 *       200:
 *         description: Login successful
 */
authRouter.post("/login", async (request, response, next) => {
    try {
        const input = loginSchema.parse(request.body);
        const user = await User.findOne({ email: input.email }).select("+passwordHash");
        if (!user || !user.isActive) {
            throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email address or password.");
        }
        const passwordMatches = await verifyPassword(input.password, user.passwordHash);
        if (!passwordMatches) {
            throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email address or password.");
        }
        user.lastLoginAt = new Date();
        await user.save();
        setAuthCookies(response, user);
        response.json({ data: { user: publicUser(user) } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get the current authenticated user
 *     responses:
 *       200:
 *         description: Current user returned
 *       401:
 *         description: Authentication required
 */
authRouter.get("/me", requireAuth, async (request, response, next) => {
    try {
        const user = await User.findById(request.user?.id).lean();
        if (!user) {
            throw new AppError(401, "AUTH_REQUIRED", "Please log in to continue.");
        }
        response.json({ data: { user: publicUser(user) } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Log out and clear auth cookies
 *     responses:
 *       204:
 *         description: Logout successful
 */
authRouter.post("/logout", (_request, response) => {
    response.clearCookie(authCookieNames.access, { path: "/" });
    response.clearCookie(authCookieNames.refresh, { path: "/" });
    response.status(204).send();
});
