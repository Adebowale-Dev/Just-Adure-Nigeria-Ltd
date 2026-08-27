import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { authCookieNames, requireAuth } from "../middleware/auth.js";
import { User } from "../models/user.js";
import { notifyEmailVerification, notifyPasswordReset } from "../services/email.js";
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
const emailSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
});
const tokenSchema = z.object({
    token: z.string().trim().min(32),
});
const resetPasswordSchema = z.object({
    token: z.string().trim().min(32),
    password: z.string().min(8).max(128),
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
function createPlainToken() {
    return randomBytes(32).toString("hex");
}
function hashAuthToken(token) {
    return createHash("sha256").update(token).digest("hex");
}
function expiresIn(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}
async function issueEmailVerification(user) {
    const token = createPlainToken();
    user.emailVerificationTokenHash = hashAuthToken(token);
    user.emailVerificationTokenExpiresAt = expiresIn(24 * 60);
    await user.save();
    await notifyEmailVerification(user, token);
    return token;
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
        await issueEmailVerification(user);
        setAuthCookies(response, user);
        response.status(201).json({ data: { user: publicUser(user), verificationRequired: true } });
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
 * /api/v1/auth/resend-verification:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend a customer email verification link
 *     responses:
 *       200:
 *         description: Verification email queued when account exists
 */
authRouter.post("/resend-verification", async (request, response, next) => {
    try {
        const input = emailSchema.parse(request.body);
        const user = await User.findOne({ email: input.email }).select("+emailVerificationTokenHash +emailVerificationTokenExpiresAt");
        if (user && !user.emailVerifiedAt && user.isActive) {
            await issueEmailVerification(user);
        }
        response.json({ data: { message: "If the account exists and is not verified, a verification email has been sent." } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify a customer email address
 *     responses:
 *       200:
 *         description: Email verified
 */
authRouter.post("/verify-email", async (request, response, next) => {
    try {
        const input = tokenSchema.parse(request.body);
        const user = await User.findOne({
            emailVerificationTokenHash: hashAuthToken(input.token),
            emailVerificationTokenExpiresAt: { $gt: new Date() },
        }).select("+emailVerificationTokenHash +emailVerificationTokenExpiresAt");
        if (!user || !user.isActive) {
            throw new AppError(400, "INVALID_VERIFICATION_TOKEN", "This verification link is invalid or has expired.");
        }
        user.emailVerifiedAt = new Date();
        user.emailVerificationTokenHash = undefined;
        user.emailVerificationTokenExpiresAt = undefined;
        await user.save();
        response.json({ data: { user: publicUser(user), message: "Email address verified successfully." } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request a password reset email
 *     responses:
 *       200:
 *         description: Password reset email queued when account exists
 */
authRouter.post("/forgot-password", async (request, response, next) => {
    try {
        const input = emailSchema.parse(request.body);
        const user = await User.findOne({ email: input.email }).select("+passwordResetTokenHash +passwordResetTokenExpiresAt");
        if (user && user.isActive) {
            const token = createPlainToken();
            user.passwordResetTokenHash = hashAuthToken(token);
            user.passwordResetTokenExpiresAt = expiresIn(60);
            await user.save();
            await notifyPasswordReset(user, token);
        }
        response.json({ data: { message: "If the account exists, a password reset email has been sent." } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset a customer password
 *     responses:
 *       200:
 *         description: Password reset successful
 */
authRouter.post("/reset-password", async (request, response, next) => {
    try {
        const input = resetPasswordSchema.parse(request.body);
        const user = await User.findOne({
            passwordResetTokenHash: hashAuthToken(input.token),
            passwordResetTokenExpiresAt: { $gt: new Date() },
        }).select("+passwordHash +passwordResetTokenHash +passwordResetTokenExpiresAt");
        if (!user || !user.isActive) {
            throw new AppError(400, "INVALID_RESET_TOKEN", "This password reset link is invalid or has expired.");
        }
        user.passwordHash = await hashPassword(input.password);
        user.passwordResetTokenHash = undefined;
        user.passwordResetTokenExpiresAt = undefined;
        await user.save();
        response.json({ data: { message: "Password reset successfully. You can now log in." } });
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
