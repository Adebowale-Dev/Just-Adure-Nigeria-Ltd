import { createHash } from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { User } from "../src/models/user.js";
import { hashPassword } from "../src/utils/password.js";
function normalizeCookies(cookieHeader) {
    if (!cookieHeader) {
        return [];
    }
    return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}
function hashToken(token) {
    return createHash("sha256").update(token).digest("hex");
}
beforeAll(async () => {
    await connectMongo(true);
});
beforeEach(async () => {
    await User.deleteMany({});
});
afterAll(async () => {
    if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
    }
    await disconnectMongo();
});
describe("authentication", () => {
    it("registers a customer, sets auth cookies and prepares email verification", async () => {
        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({
            name: "Ada Customer",
            email: "ada@example.com",
            phone: "08012345678",
            password: "StrongPass123",
        })
            .expect(201);
        expect(response.body.data.user).toMatchObject({
            name: "Ada Customer",
            email: "ada@example.com",
            roles: ["customer"],
            emailVerified: false,
        });
        expect(response.body.data.verificationRequired).toBe(true);
        expect(response.body.data.user.passwordHash).toBeUndefined();
        expect(normalizeCookies(response.headers["set-cookie"]).join(";")).toContain("HttpOnly");
        const user = await User.findOne({ email: "ada@example.com" }).select("+emailVerificationTokenHash +emailVerificationTokenExpiresAt");
        expect(user?.emailVerificationTokenHash).toBeTruthy();
        expect(user?.emailVerificationTokenExpiresAt).toBeInstanceOf(Date);
    });
    it("rejects duplicate registration emails", async () => {
        const payload = {
            name: "Ada Customer",
            email: "ada@example.com",
            phone: "08012345678",
            password: "StrongPass123",
        };
        await request(app).post("/api/v1/auth/register").send(payload).expect(201);
        const response = await request(app).post("/api/v1/auth/register").send(payload).expect(409);
        expect(response.body.error.code).toBe("EMAIL_ALREADY_REGISTERED");
    });
    it("verifies a customer email with a valid token", async () => {
        const token = "verification-token-for-test-1234567890";
        const user = await User.create({
            name: "Verified Buyer",
            email: "verified@example.com",
            phone: "08012345678",
            passwordHash: await hashPassword("StrongPass123"),
            roles: ["customer"],
            emailVerificationTokenHash: hashToken(token),
            emailVerificationTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });
        const response = await request(app).post("/api/v1/auth/verify-email").send({ token }).expect(200);
        expect(response.body.data.user.emailVerified).toBe(true);
        const updated = await User.findById(user._id).select("+emailVerificationTokenHash +emailVerificationTokenExpiresAt");
        expect(updated?.emailVerifiedAt).toBeInstanceOf(Date);
        expect(updated?.emailVerificationTokenHash).toBeUndefined();
    });
    it("sends a safe response for forgotten password requests", async () => {
        await User.create({
            name: "Reset Buyer",
            email: "reset@example.com",
            phone: "08012345678",
            passwordHash: await hashPassword("StrongPass123"),
            roles: ["customer"],
        });
        const response = await request(app).post("/api/v1/auth/forgot-password").send({ email: "reset@example.com" }).expect(200);
        expect(response.body.data.message).toContain("If the account exists");
        const user = await User.findOne({ email: "reset@example.com" }).select("+passwordResetTokenHash +passwordResetTokenExpiresAt");
        expect(user?.passwordResetTokenHash).toBeTruthy();
        expect(user?.passwordResetTokenExpiresAt).toBeInstanceOf(Date);
        await request(app).post("/api/v1/auth/forgot-password").send({ email: "missing@example.com" }).expect(200);
    });
    it("resets a customer password with a valid token", async () => {
        const token = "password-reset-token-for-test-1234567890";
        await User.create({
            name: "Password Buyer",
            email: "password@example.com",
            phone: "08012345678",
            passwordHash: await hashPassword("OldStrongPass123"),
            roles: ["customer"],
            passwordResetTokenHash: hashToken(token),
            passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });
        await request(app).post("/api/v1/auth/reset-password").send({ token, password: "NewStrongPass123" }).expect(200);
        const login = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "password@example.com", password: "NewStrongPass123" })
            .expect(200);
        expect(login.body.data.user.email).toBe("password@example.com");
        const user = await User.findOne({ email: "password@example.com" }).select("+passwordResetTokenHash");
        expect(user?.passwordResetTokenHash).toBeUndefined();
    });
    it("logs in and allows the current user to be fetched with the auth cookie", async () => {
        const payload = {
            name: "Bola Buyer",
            email: "bola@example.com",
            phone: "08123456789",
            password: "StrongPass123",
        };
        await request(app).post("/api/v1/auth/register").send(payload).expect(201);
        const login = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: payload.email, password: payload.password })
            .expect(200);
        const me = await request(app)
            .get("/api/v1/auth/me")
            .set("Cookie", normalizeCookies(login.headers["set-cookie"]))
            .expect(200);
        expect(me.body.data.user).toMatchObject({ email: payload.email, roles: ["customer"] });
    });
    it("protects current-user lookup when no auth cookie is present", async () => {
        const response = await request(app).get("/api/v1/auth/me").expect(401);
        expect(response.body.error.code).toBe("AUTH_REQUIRED");
    });
});
