import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
describe("API foundation", () => {
    it("redirects the service root to the API documentation", async () => {
        const response = await request(app).get("/").expect(302);
        expect(response.headers.location).toBe("/api/docs");
    });
    it("reports process health with security and request headers", async () => {
        const response = await request(app).get("/health").expect(200);
        expect(response.body.data.status).toBe("ok");
        expect(response.headers["x-request-id"]).toBeTruthy();
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.headers["x-powered-by"]).toBeUndefined();
    });
    it("returns a safe, consistent response for unknown routes", async () => {
        const response = await request(app).get("/missing").expect(404);
        expect(response.body).toMatchObject({
            error: {
                code: "ROUTE_NOT_FOUND",
            },
        });
        expect(response.body.requestId).toBeTruthy();
    });
    it("rejects unsigned Paystack webhook requests", async () => {
        const response = await request(app)
            .post("/api/v1/webhooks/paystack")
            .set("content-type", "application/json")
            .send(JSON.stringify({ event: "charge.success" }))
            .expect(401);
        expect(response.body.error.code).toBe("INVALID_PAYSTACK_SIGNATURE");
    });
});
