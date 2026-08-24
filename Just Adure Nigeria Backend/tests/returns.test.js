import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Order } from "../src/models/order.js";
import { ReturnRequest } from "../src/models/return-request.js";
import { User } from "../src/models/user.js";
import { hashPassword } from "../src/utils/password.js";

function normalizeCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

async function clearCollections() {
  await Promise.all([ReturnRequest.deleteMany({}), Order.deleteMany({}), User.deleteMany({})]);
}

async function createAdminCookies() {
  await User.create({
    name: "Admin User",
    email: "admin@example.com",
    phone: "08012345678",
    passwordHash: await hashPassword("StrongPass123"),
    roles: ["admin"],
    emailVerifiedAt: new Date(),
  });
  const login = await request(app).post("/api/v1/auth/login").send({ email: "admin@example.com", password: "StrongPass123" }).expect(200);
  return normalizeCookies(login.headers["set-cookie"]);
}

async function seedDeliveredOrder(overrides = {}) {
  const productId = new mongoose.Types.ObjectId();
  return Order.create({
    orderNumber: "JAN-RETURN-001",
    customer: { name: "Ade Customer", email: "customer@example.com", phone: "08012345678", addressLine1: "12 Allen Avenue", state: "Lagos", city: "Ikeja" },
    items: [{ productId, name: "iPhone 13 Pro", slug: "iphone-13-pro", sku: "JAN-PHN-001", condition: "Excellent", unitPriceKobo: 675_000_00, quantity: 1, lineSubtotalKobo: 675_000_00 }],
    subtotalKobo: 675_000_00,
    discountKobo: 0,
    deliveryFeeKobo: 5_000_00,
    totalKobo: 680_000_00,
    currency: "NGN",
    deliveryMethod: "delivery",
    paymentStatus: "successful",
    orderStatus: "delivered",
    statusHistory: [{ status: "delivered", note: "Delivered." }],
    reservations: [],
    ...overrides,
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

describe("returns and refunds", () => {
  it("allows a customer to request a return for a delivered paid order", async () => {
    const order = await seedDeliveredOrder();

    const response = await request(app)
      .post(`/api/v1/orders/${String(order._id)}/returns`)
      .send({
        email: "customer@example.com",
        reason: "not_as_described",
        details: "The visible scratch is deeper than described on the product page.",
        items: [{ sku: "JAN-PHN-001", quantity: 1 }],
      })
      .expect(201);

    expect(response.body.data.returnRequest).toMatchObject({
      orderNumber: order.orderNumber,
      status: "requested",
      reason: "not_as_described",
    });

    const updatedOrder = await Order.findById(order._id).lean();
    expect(updatedOrder.orderStatus).toBe("return_requested");
  });

  it("allows an admin to approve and mark a return as refunded", async () => {
    const order = await seedDeliveredOrder();
    const create = await request(app)
      .post(`/api/v1/orders/${String(order._id)}/returns`)
      .send({ email: "customer@example.com", reason: "defective", details: "The device stopped charging after delivery." })
      .expect(201);
    const cookies = await createAdminCookies();

    await request(app)
      .patch(`/api/v1/admin/returns/${create.body.data.returnRequest.id}`)
      .set("Cookie", cookies)
      .send({ status: "approved", adminNote: "Approved after inspection evidence." })
      .expect(200);

    const refunded = await request(app)
      .patch(`/api/v1/admin/returns/${create.body.data.returnRequest.id}`)
      .set("Cookie", cookies)
      .send({ status: "refunded", adminNote: "Refund confirmed manually." })
      .expect(200);

    expect(refunded.body.data.returnRequest).toMatchObject({ status: "refunded", adminNote: "Refund confirmed manually." });
    const updatedOrder = await Order.findById(order._id).lean();
    expect(updatedOrder).toMatchObject({ orderStatus: "refunded", paymentStatus: "refunded" });
  });

  it("rejects return requests for unpaid orders", async () => {
    const order = await seedDeliveredOrder({ paymentStatus: "pending" });

    const response = await request(app)
      .post(`/api/v1/orders/${String(order._id)}/returns`)
      .send({ email: "customer@example.com", reason: "other", details: "I need support with this order." })
      .expect(409);

    expect(response.body.error.code).toBe("ORDER_NOT_PAID");
  });
});