import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Order } from "../src/models/order.js";
import { User } from "../src/models/user.js";

function normalizeCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

async function clearCollections() {
  await Promise.all([Order.deleteMany({}), User.deleteMany({})]);
}

async function createOrder(overrides = {}) {
  return Order.create({
    orderNumber: overrides.orderNumber ?? "JAN-TRACK-001",
    userId: overrides.userId,
    customer: {
      name: "Ade Customer",
      email: overrides.email ?? "customer@example.com",
      phone: "08012345678",
      addressLine1: "12 Allen Avenue",
      state: "Lagos",
      city: "Ikeja",
    },
    items: [
      {
        productId: new mongoose.Types.ObjectId(),
        name: "iPhone 13 Pro 256GB",
        slug: "iphone-13-pro-256gb",
        sku: "JAN-PHN-001",
        condition: "Excellent",
        imageUrl: "https://example.com/iphone.jpg",
        unitPriceKobo: 675_000_00,
        quantity: 1,
        lineSubtotalKobo: 675_000_00,
      },
    ],
    subtotalKobo: 675_000_00,
    discountKobo: 0,
    deliveryFeeKobo: 5_000_00,
    totalKobo: 680_000_00,
    currency: "NGN",
    deliveryMethod: "delivery",
    paymentStatus: overrides.paymentStatus ?? "successful",
    orderStatus: overrides.orderStatus ?? "paid",
    statusHistory: [
      { status: "pending_payment", note: "Order created." },
      { status: overrides.orderStatus ?? "paid", note: "Payment verified." },
    ],
    reservations: [],
  });
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

describe("orders API", () => {
  it("tracks an order with order number and customer email", async () => {
    const order = await createOrder();

    const response = await request(app)
      .get(`/api/v1/orders/track?orderNumber=${order.orderNumber}&email=customer@example.com`)
      .expect(200);

    expect(response.body.data.order).toMatchObject({
      orderNumber: order.orderNumber,
      paymentStatus: "successful",
      orderStatus: "paid",
      totalKobo: 680_000_00,
      customer: { email: "customer@example.com" },
    });
    expect(response.body.data.order.items[0]).toMatchObject({ sku: "JAN-PHN-001", condition: "Excellent" });
  });

  it("does not expose an order when the email does not match", async () => {
    const order = await createOrder();

    const response = await request(app)
      .get(`/api/v1/orders/track?orderNumber=${order.orderNumber}&email=wrong@example.com`)
      .expect(404);

    expect(response.body.error.code).toBe("ORDER_NOT_FOUND");
  });

  it("lists only the authenticated customer's own orders", async () => {
    const register = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Bola Buyer", email: "bola@example.com", phone: "08123456789", password: "StrongPass123" })
      .expect(201);
    const userId = register.body.data.user.id;

    await createOrder({ orderNumber: "JAN-MINE-001", userId, email: "bola@example.com" });
    await createOrder({ orderNumber: "JAN-OTHER-001", email: "other@example.com" });

    const response = await request(app)
      .get("/api/v1/orders/my")
      .set("Cookie", normalizeCookies(register.headers["set-cookie"]))
      .expect(200);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0]).toMatchObject({ orderNumber: "JAN-MINE-001", customer: { email: "bola@example.com" } });
  });

  it("protects authenticated order history", async () => {
    const response = await request(app).get("/api/v1/orders/my").expect(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });
});