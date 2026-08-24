import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { Order } from "../models/order.js";
import { Payment } from "../models/payment.js";
import { Product } from "../models/catalogue.js";
import { markCouponUsed } from "./coupons.js";
import { notifyPaymentSuccessful } from "./email.js";
import { notifyAdmins, notifyCustomer } from "./notifications.js";

const paystackBaseUrl = "https://api.paystack.co";

export function createPaymentReference(orderNumber) {
  return `JAN-${orderNumber}-${randomUUID().slice(0, 10).toUpperCase()}`;
}

async function paystackRequest(path, options = {}) {
  const response = await fetch(`${paystackBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.status) {
    throw new AppError(502, "PAYSTACK_REQUEST_FAILED", payload?.message ?? "Paystack request failed.");
  }

  return payload;
}

export async function initializePaystackPayment({ orderId, callbackUrl }) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order was not found.");
  if (order.paymentStatus === "successful") throw new AppError(409, "ORDER_ALREADY_PAID", "This order has already been paid.");
  if (order.orderStatus !== "pending_payment") throw new AppError(409, "ORDER_NOT_PAYABLE", "This order is no longer awaiting payment.");

  let payment = await Payment.findOne({ orderId: order._id, status: "pending" });
  if (!payment) {
    payment = await Payment.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      reference: createPaymentReference(order.orderNumber),
      amountKobo: order.totalKobo,
      currency: order.currency,
      status: "pending",
      customerEmail: order.customer.email,
    });
  }

  if (payment.amountKobo !== order.totalKobo || payment.currency !== order.currency) {
    throw new AppError(409, "PAYMENT_TOTAL_MISMATCH", "The payment total no longer matches the order total.");
  }

  const payload = await paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: order.customer.email,
      amount: order.totalKobo,
      currency: order.currency,
      reference: payment.reference,
      callback_url: callbackUrl || `${env.WEB_URL}/payment-result?reference=${payment.reference}`,
      metadata: {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
      },
    }),
  });

  payment.authorizationUrl = payload.data.authorization_url;
  payment.accessCode = payload.data.access_code;
  payment.rawInitializeResponse = payload;
  await payment.save();

  return { order, payment };
}

export async function verifyPaystackPayment(reference) {
  const payment = await Payment.findOne({ reference });
  if (!payment) throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment reference was not found.");

  const payload = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
  return processPaystackVerification({ payment, verification: payload.data, rawResponse: payload });
}

export async function processPaystackVerification({ payment, verification, rawResponse }) {
  const order = await Order.findById(payment.orderId);
  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order for this payment was not found.");

  const amountMatches = Number(verification.amount) === Number(order.totalKobo);
  const currencyMatches = verification.currency === order.currency;
  const referenceMatches = verification.reference === payment.reference;

  if (!amountMatches || !currencyMatches || !referenceMatches) {
    payment.status = "failed";
    payment.gatewayResponse = verification.gateway_response ?? "Verification mismatch";
    payment.rawVerificationResponse = rawResponse;
    payment.verifiedAt = new Date();
    await payment.save();
    throw new AppError(409, "PAYMENT_VERIFICATION_MISMATCH", "Paystack verification did not match the pending order.");
  }

  payment.paystackTransactionId = verification.id ? String(verification.id) : payment.paystackTransactionId;
  payment.channel = verification.channel ?? payment.channel;
  payment.gatewayResponse = verification.gateway_response ?? payment.gatewayResponse;
  payment.rawVerificationResponse = rawResponse;
  payment.verifiedAt = new Date();

  if (verification.status !== "success") {
    payment.status = verification.status === "abandoned" ? "abandoned" : "failed";
    await payment.save();
    order.paymentStatus = payment.status;
    await order.save();
    return { order, payment, paid: false };
  }

  if (payment.status === "successful" && order.paymentStatus === "successful") {
    return { order, payment, paid: true };
  }

  payment.status = "successful";
  payment.paidAt = verification.paid_at ? new Date(verification.paid_at) : new Date();
  await payment.save();

  await finalizePaidOrder(order);
  await notifyPaymentSuccessful(order, payment);
  await notifyCustomer(order.userId, { type: "payment", title: "Payment successful", message: `Payment for ${order.orderNumber} has been verified.`, resourceType: "order", resourceId: String(order._id), actionUrl: `/order-tracking?orderNumber=${encodeURIComponent(order.orderNumber)}` });
  await notifyAdmins({ type: "payment", title: "Payment received", message: `${order.orderNumber} has been paid successfully.`, resourceType: "payment", resourceId: String(payment._id), actionUrl: "/admin" });
  return { order, payment, paid: true };
}

async function finalizePaidOrder(order) {
  if (order.paymentStatus === "successful") return;

  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.productId },
      { $inc: { stockQuantity: -item.quantity, reservedQuantity: -item.quantity } },
    );
    const product = await Product.findById(item.productId);
    if (product && product.stockQuantity <= 0) {
      product.stockQuantity = 0;
      product.reservedQuantity = Math.max(0, product.reservedQuantity);
      product.availability = "out_of_stock";
      await product.save();
    }
  }

  await markCouponUsed(order.couponId);

  order.paymentStatus = "successful";
  order.orderStatus = "paid";
  order.statusHistory.push({ status: "paid", note: "Payment verified by Paystack." });
  await order.save();
}

export function verifyPaystackSignature(rawBody, signature) {
  if (!signature || !rawBody) return false;
  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function webhookHash(rawBody) {
  return createHash("sha256").update(rawBody).digest("hex");
}