import { Router } from "express";
import { z } from "zod";
import { initializePaystackPayment, verifyPaystackPayment } from "../services/paystack.js";

export const paymentsRouter = Router();

const initializeSchema = z.object({
  orderId: z.string().trim().min(1),
  callbackUrl: z.string().trim().url().optional(),
});

/**
 * @openapi
 * /api/v1/payments/paystack/initialize:
 *   post:
 *     tags: [Payments]
 *     summary: Initialize a Paystack payment for a pending order
 *     responses:
 *       200:
 *         description: Paystack authorization URL returned
 */
paymentsRouter.post("/payments/paystack/initialize", async (request, response, next) => {
  try {
    const input = initializeSchema.parse(request.body);
    const { order, payment } = await initializePaystackPayment(input);

    response.json({
      data: {
        payment: {
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          reference: payment.reference,
          amountKobo: payment.amountKobo,
          currency: payment.currency,
          status: payment.status,
          authorizationUrl: payment.authorizationUrl,
          accessCode: payment.accessCode,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/payments/paystack/verify/{reference}:
 *   get:
 *     tags: [Payments]
 *     summary: Verify a Paystack transaction and finalize a paid order
 *     responses:
 *       200:
 *         description: Payment verification result returned
 */
paymentsRouter.get("/payments/paystack/verify/:reference", async (request, response, next) => {
  try {
    const result = await verifyPaystackPayment(request.params.reference);

    response.json({
      data: {
        paid: result.paid,
        payment: {
          reference: result.payment.reference,
          status: result.payment.status,
          amountKobo: result.payment.amountKobo,
          currency: result.payment.currency,
          channel: result.payment.channel,
          gatewayResponse: result.payment.gatewayResponse,
          paidAt: result.payment.paidAt,
          verifiedAt: result.payment.verifiedAt,
        },
        order: {
          id: String(result.order._id),
          orderNumber: result.order.orderNumber,
          paymentStatus: result.order.paymentStatus,
          orderStatus: result.order.orderStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});