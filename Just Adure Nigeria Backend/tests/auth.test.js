import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { User } from "../src/models/user.js";
function normalizeCookies(cookieHeader) {
    if (!cookieHeader) {
        return [];
    }
    return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
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
    it("registers a customer and sets secure http-only auth cookies", async () => {
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
        expect(response.body.data.user.passwordHash).toBeUndefined();
        expect(normalizeCookies(response.headers["set-cookie"]).join(";")).toContain("HttpOnly");
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
