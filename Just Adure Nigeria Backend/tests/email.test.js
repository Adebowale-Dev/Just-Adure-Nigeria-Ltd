import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { EmailLog } from "../src/models/email-log.js";
import { Order } from "../src/models/order.js";
import { notifyOrderReceived, sendBrevoEmail } from "../src/services/email.js";

function orderPayload() {
  return {
    orderNumber: "JAN-20260824-EMAIL01",
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
        productId: new mongoose.Types.ObjectId(),
        name: "iPhone 13 Pro 256GB",
        slug: "iphone-13-pro-256gb",
        sku: "JAN-PHN-001",
        condition: "Excellent",
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
    reservations: [
      {
        productId: new mongoose.Types.ObjectId(),
        quantity: 1,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    ],
  };
}

beforeAll(async () => {
  await connectMongo(true);
});

beforeEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all([EmailLog.deleteMany({}), Order.deleteMany({})]);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await Promise.all([EmailLog.deleteMany({}), Order.deleteMany({})]);
  await disconnectMongo();
});

describe("Brevo email service", () => {
  it("logs skipped order emails when Brevo credentials are placeholders", async () => {
    const order = await Order.create(orderPayload());

    await notifyOrderReceived(order);

    const logs = await EmailLog.find({ orderNumber: order.orderNumber }).sort({ template: 1 });
    expect(logs).toHaveLength(2);
    expect(logs.map((log) => log.status)).toEqual(["skipped", "skipped"]);
    expect(logs.map((log) => log.template).sort()).toEqual(["new_order_admin", "order_received_customer"]);
  });

  it("sends through Brevo and records the provider message id when configured", async () => {
    const originalKey = env.BREVO_API_KEY;
    env.BREVO_API_KEY = "xkeysib-test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ messageId: "brevo-message-123" }),
      })),
    );

    const result = await sendBrevoEmail({
      to: { email: "customer@example.com", name: "Ade Customer" },
      subject: "Test email",
      template: "test_template",
      htmlContent: "<p>Hello</p>",
      textContent: "Hello",
    });

    env.BREVO_API_KEY = originalKey;

    const log = await EmailLog.findOne({ template: "test_template" });
    expect(result.status).toBe("sent");
    expect(fetch).toHaveBeenCalledOnce();
    expect(log.status).toBe("sent");
    expect(log.providerMessageId).toBe("brevo-message-123");
  });
});