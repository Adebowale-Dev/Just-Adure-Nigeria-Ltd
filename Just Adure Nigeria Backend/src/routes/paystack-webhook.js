import { Router } from "express";
export const paystackWebhookRouter = Router();
/**
 * @openapi
 * /api/v1/webhooks/paystack:
 *   post:
 *     tags: [Payments]
 *     summary: Receive signed Paystack events
 *     description: Signature verification and idempotent processing are implemented in Milestone 5.
 *     responses:
 *       501:
 *         description: Payment integration has not been enabled yet
 */
paystackWebhookRouter.post("/", (_request, response) => {
    response.status(501).json({
        error: {
            code: "PAYMENT_INTEGRATION_NOT_ENABLED",
            message: "Paystack processing will be enabled in the payment milestone.",
        },
        requestId: response.locals.requestId,
    });
});
