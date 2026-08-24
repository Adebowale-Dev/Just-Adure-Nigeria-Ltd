import { Router } from "express";
import { Payment } from "../models/payment.js";
import { verifyPaystackPayment, verifyPaystackSignature, webhookHash } from "../services/paystack.js";

export const paystackWebhookRouter = Router();

/**
 * @openapi
 * /api/v1/webhooks/paystack:
 *   post:
 *     tags: [Payments]
 *     summary: Receive signed Paystack events
 *     responses:
 *       200:
 *         description: Webhook accepted
 */
paystackWebhookRouter.post("/", async (request, response, next) => {
  try {
    const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.from(JSON.stringify(request.body ?? {}));
    const signature = request.get("x-paystack-signature");

    if (!verifyPaystackSignature(rawBody, signature)) {
      response.status(401).json({
        error: {
          code: "INVALID_PAYSTACK_SIGNATURE",
          message: "Paystack webhook signature is invalid.",
        },
        requestId: response.locals.requestId,
      });
      return;
    }

    const eventHash = webhookHash(rawBody);
    const event = JSON.parse(rawBody.toString("utf8"));
    const reference = event?.data?.reference;

    if (!reference) {
      response.status(400).json({
        error: {
          code: "PAYSTACK_REFERENCE_MISSING",
          message: "Paystack webhook did not include a payment reference.",
        },
        requestId: response.locals.requestId,
      });
      return;
    }

    const payment = await Payment.findOne({ reference });
    if (payment?.processedWebhookHashes.includes(eventHash)) {
      response.json({ data: { received: true, duplicate: true } });
      return;
    }

    if (event.event === "charge.success") {
      await verifyPaystackPayment(reference);
    }

    await Payment.updateOne(
      { reference },
      { $addToSet: { processedWebhookHashes: eventHash } },
    );

    response.json({ data: { received: true, duplicate: false } });
  } catch (error) {
    next(error);
  }
});