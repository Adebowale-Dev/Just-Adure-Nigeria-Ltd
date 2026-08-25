import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { User } from "../src/models/user.js";

function normalizeCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

async function clearCollections() {
  await User.deleteMany({});
}

async function registerCustomer() {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "Account Buyer", email: "account@example.com", phone: "08012345678", password: "StrongPass123" })
    .expect(201);
  return normalizeCookies(response.headers["set-cookie"]);
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

describe("account API", () => {
  it("requires login before showing the account profile", async () => {
    const response = await request(app).get("/api/v1/account").expect(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("returns and updates the logged-in customer profile", async () => {
    const cookies = await registerCustomer();

    const profile = await request(app).get("/api/v1/account").set("Cookie", cookies).expect(200);
    expect(profile.body.data.account).toMatchObject({ email: "account@example.com", name: "Account Buyer", addresses: [] });

    const updated = await request(app)
      .patch("/api/v1/account")
      .set("Cookie", cookies)
      .send({ name: "Updated Buyer", phone: "08123456789" })
      .expect(200);

    expect(updated.body.data.account).toMatchObject({ name: "Updated Buyer", phone: "08123456789" });
  });

  it("adds, updates, defaults, and deletes delivery addresses", async () => {
    const cookies = await registerCustomer();

    const first = await request(app)
      .post("/api/v1/account/addresses")
      .set("Cookie", cookies)
      .send({ label: "Home", recipientName: "Account Buyer", phone: "08012345678", addressLine1: "12 Allen Avenue", state: "Lagos", city: "Ikeja", isDefault: true })
      .expect(201);

    const firstAddress = first.body.data.address;
    expect(firstAddress).toMatchObject({ label: "Home", isDefault: true });

    const second = await request(app)
      .post("/api/v1/account/addresses")
      .set("Cookie", cookies)
      .send({ label: "Office", recipientName: "Account Buyer", phone: "08012345678", addressLine1: "20 Marina Road", state: "Lagos", city: "Lagos Island", isDefault: true })
      .expect(201);

    expect(second.body.data.account.addresses.find((address) => address.label === "Office").isDefault).toBe(true);
    expect(second.body.data.account.addresses.find((address) => address.label === "Home").isDefault).toBe(false);

    const updated = await request(app)
      .patch(`/api/v1/account/addresses/${firstAddress.id}`)
      .set("Cookie", cookies)
      .send({ city: "Surulere", deliveryInstructions: "Call before arrival" })
      .expect(200);

    expect(updated.body.data.address).toMatchObject({ city: "Surulere", deliveryInstructions: "Call before arrival" });

    const deleted = await request(app)
      .delete(`/api/v1/account/addresses/${firstAddress.id}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(deleted.body.data.account.addresses).toHaveLength(1);
    expect(deleted.body.data.account.addresses[0]).toMatchObject({ label: "Office", isDefault: true });
  });

  it("validates Nigerian phone numbers on saved addresses", async () => {
    const cookies = await registerCustomer();
    const response = await request(app)
      .post("/api/v1/account/addresses")
      .set("Cookie", cookies)
      .send({ label: "Home", recipientName: "Account Buyer", phone: "12345", addressLine1: "12 Allen Avenue", state: "Lagos", city: "Ikeja" })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});