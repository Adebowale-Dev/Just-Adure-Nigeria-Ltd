import { Router } from "express";
import { z } from "zod";
import { NewsletterSubscriber } from "../models/newsletter-subscriber.js";
import { notifyNewsletterSubscription } from "../services/email.js";

export const newsletterRouter = Router();

const subscribeSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  name: z.string().trim().min(2).max(120).optional(),
  source: z.string().trim().min(2).max(80).default("footer"),
});

export function serializeNewsletterSubscriber(subscriber) {
  return {
    id: String(subscriber._id),
    email: subscriber.email,
    name: subscriber.name ?? null,
    status: subscriber.status,
    source: subscriber.source,
    subscribedAt: subscriber.subscribedAt,
  };
}

/**
 * @openapi
 * /api/v1/newsletter/subscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Subscribe a guest or customer to newsletter updates
 *     responses:
 *       200:
 *         description: Newsletter subscription saved
 */
newsletterRouter.post("/newsletter/subscribe", async (request, response, next) => {
  try {
    const input = subscribeSchema.parse(request.body);
    const now = new Date();
    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { email: input.email },
      {
        $set: {
          name: input.name,
          status: "subscribed",
          source: input.source,
          subscribedAt: now,
          unsubscribedAt: null,
          lastIpAddress: request.ip,
          lastUserAgent: request.get("user-agent") ?? "",
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    await notifyNewsletterSubscription(subscriber);
    response.json({ data: { subscriber: serializeNewsletterSubscriber(subscriber) } });
  } catch (error) {
    next(error);
  }
});