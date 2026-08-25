import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { EmailLog } from "../src/models/email-log.js";
import { NewsletterSubscriber } from "../src/models/newsletter-subscriber.js";

async function clearCollections() {
  await Promise.all([
    EmailLog.deleteMany({}),
    NewsletterSubscriber.deleteMany({}),
  ]);
}

beforeAll(async () => {
  await connectMongo(true);
});

beforeEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await clearCollections();
  await disconnectMongo();
});

describe("newsletter API", () => {
  it("subscribes a guest and logs the confirmation email", async () => {
    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "buyer@example.com", name: "Buyer One", source: "footer" })
      .expect(200);

    expect(response.body.data.subscriber).toMatchObject({
      email: "buyer@example.com",
      name: "Buyer One",
      status: "subscribed",
      source: "footer",
    });

    const email = await EmailLog.findOne({ recipientEmail: "buyer@example.com", template: "newsletter_subscription_confirmation" }).lean();
    expect(email).toMatchObject({ status: "skipped", subject: "You are subscribed to Just Adure Nigeria Ltd updates" });
  });

  it("updates an existing subscriber without creating duplicates", async () => {
    await request(app).post("/api/v1/newsletter/subscribe").send({ email: "buyer@example.com", name: "Old Name" }).expect(200);
    const response = await request(app).post("/api/v1/newsletter/subscribe").send({ email: "buyer@example.com", name: "New Name", source: "homepage" }).expect(200);

    expect(response.body.data.subscriber).toMatchObject({ name: "New Name", source: "homepage", status: "subscribed" });
    expect(await NewsletterSubscriber.countDocuments({ email: "buyer@example.com" })).toBe(1);
  });

  it("rejects invalid email addresses", async () => {
    const response = await request(app).post("/api/v1/newsletter/subscribe").send({ email: "not-an-email" }).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});