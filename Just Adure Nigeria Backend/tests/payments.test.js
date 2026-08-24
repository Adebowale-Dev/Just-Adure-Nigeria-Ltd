import { createHmac } from "node:crypto";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Brand, Category, ConditionGrade, Product } from "../src/models/catalogue.js";
import { Order } from "../src/models/order.js";
import { Payment } from "../src/models/payment.js";

async function clearCollections() {
  await Promise.all([
    Payment.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Brand.deleteMany({}),
    Category.deleteMany({}),
    ConditionGrade.deleteMany({}),
  ]);
}

async function seedProduct() {
  const grade = await ConditionGrade.create({ code: "excellent", name: "Excellent", description: "Clean UK-used device.", sortOrder: 1 });
  const brand = await Brand.create({ name: "Apple", slug: "apple" });
  const category = await Category.create({ name: "Phones", slug: "phones" });

  return Product.create({
    name: "iPhone 13 Pro 256GB",
    slug: "iphone-13-pro-256gb",
    sku: "JAN-PHN-001",
    brandId: brand._id,
    categoryId: category._id,
    conditionGradeId: grade._id,
    priceKobo: 675_000_00,
    stockQuantity: 1,
    reservedQuantity: 1,
    shortDescription: "Unlocked UK-used iPhone.",
    description: "Tested UK-used iPhone.",
    visibleDefects: "Two faint frame marks.",
    includedAccessories: "USB-C cable only.",
    warrantyInformation: "30-day limited warranty.",
    colour: "Sierra Blue",
    modelNumber: "A2638",
    availability: "in_stock",
    images: [{ cloudinaryPublicId: "demo/iphone", secureUrl: "https://example.com/iphone.jpg", altText: "iPhone", isPrimary: true }],
    specifications: [{ label: "Storage", value: "256GB" }],
  });
}

async function seedPendingOrder() {
  const product = await seedProduct();
  const order = await Order.create({
    orderNumber: "JAN-TEST-001",
    customer: {
      name: "Ade Customer",
      email: "customer@example.com",
      phone: "08012345678",
      addressLine1: "12 Allen Avenue",
      state: "Lagos",
      city: "Ikeja",
    },
    items: [
      {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
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
    paymentStatus: "pending",
    orderStatus: "pending_payment",
    statusHistory: [{ status: "pending_payment", note: "Order created." }],
    reservations: [{ productId: product._id, quantity: 1, expiresAt: new Date(Date.now() + 900_000) }],
  });

  return { order, product };
}

function mockPaystack(payload) {
  return vi.fn(async () => new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } }));
}

beforeAll(async () => {
  await connectMongo(true);
});

beforeEach(async () => {
  await clearCollections();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await clearCollections();
  await disconnectMongo();
});

describe("Paystack payments API", () => {
  it("initializes a Paystack transaction for a pending order without exposing the secret key", async () => {
    const { order } = await seedPendingOrder();
    const fetchMock = mockPaystack({
      status: true,
      message: "Authorization URL created",
      data: { authorization_url: "https://checkout.paystack.com/test", access_code: "access-test", reference: "ignored" },
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await request(app)
      .post("/api/v1/payments/paystack/initialize")
      .send({ orderId: String(order._id) })
      .expect(200);

    expect(response.body.data.payment).toMatchObject({
      orderNumber: order.orderNumber,
      amountKobo: 680_000_00,
      currency: "NGN",
      status: "pending",
      authorizationUrl: "https://checkout.paystack.com/test",
      accessCode: "access-test",
    });
    expect(response.body.data.payment).not.toHaveProperty("secretKey");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toMatch(/^Bearer /);
  });

  it("verifies a successful Paystack payment, marks the order paid and finalizes stock", async () => {
    const { order, product } = await seedPendingOrder();
    const payment = await Payment.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      reference: "JAN-VERIFY-001",
      amountKobo: order.totalKobo,
      currency: "NGN",
      status: "pending",
      customerEmail: order.customer.email,
    });
    vi.stubGlobal("fetch", mockPaystack({
      status: true,
      message: "Verification successful",
      data: {
        id: 12345,
        status: "success",
        reference: payment.reference,
        amount: order.totalKobo,
        currency: "NGN",
        channel: "card",
        gateway_response: "Successful",
        paid_at: "2026-08-24T10:00:00.000Z",
      },
    }));

    const response = await request(app).get(`/api/v1/payments/paystack/verify/${payment.reference}`).expect(200);
    const updatedOrder = await Order.findById(order._id).lean();
    const updatedProduct = await Product.findById(product._id).lean();

    expect(response.body.data).toMatchObject({ paid: true, order: { paymentStatus: "successful", orderStatus: "paid" } });
    expect(updatedOrder.paymentStatus).toBe("successful");
    expect(updatedProduct.stockQuantity).toBe(0);
    expect(updatedProduct.reservedQuantity).toBe(0);
    expect(updatedProduct.availability).toBe("out_of_stock");
  });

  it("rejects unsigned Paystack webhooks", async () => {
    const response = await request(app)
      .post("/api/v1/webhooks/paystack")
      .set("Content-Type", "application/json")
      .send({ event: "charge.success", data: { reference: "JAN-VERIFY-001" } })
      .expect(401);

    expect(response.body.error.code).toBe("INVALID_PAYSTACK_SIGNATURE");
  });

  it("processes signed charge.success webhooks idempotently", async () => {
    const { order } = await seedPendingOrder();
    const payment = await Payment.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      reference: "JAN-WEBHOOK-001",
      amountKobo: order.totalKobo,
      currency: "NGN",
      status: "pending",
      customerEmail: order.customer.email,
    });
    const rawBody = JSON.stringify({ event: "charge.success", data: { reference: payment.reference } });
    const signature = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
    const fetchMock = mockPaystack({
      status: true,
      message: "Verification successful",
      data: {
        id: 777,
        status: "success",
        reference: payment.reference,
        amount: order.totalKobo,
        currency: "NGN",
        channel: "card",
        gateway_response: "Successful",
        paid_at: "2026-08-24T10:00:00.000Z",
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await request(app)
      .post("/api/v1/webhooks/paystack")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", signature)
      .send(rawBody)
      .expect(200);

    const duplicate = await request(app)
      .post("/api/v1/webhooks/paystack")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", signature)
      .send(rawBody)
      .expect(200);

    expect(duplicate.body.data).toMatchObject({ received: true, duplicate: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});