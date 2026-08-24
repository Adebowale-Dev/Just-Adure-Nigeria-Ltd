import { Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "../middleware/auth.js";
import { Order } from "../models/order.js";

export const ordersRouter = Router();

const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(4).max(80),
  email: z.string().trim().email().toLowerCase(),
});

function publicOrder(order) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      state: order.customer.state,
      city: order.customer.city,
    },
    items: order.items.map((item) => ({
      productId: String(item.productId),
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      condition: item.condition,
      imageUrl: item.imageUrl,
      unitPriceKobo: item.unitPriceKobo,
      quantity: item.quantity,
      lineSubtotalKobo: item.lineSubtotalKobo,
    })),
    subtotalKobo: order.subtotalKobo,
    discountKobo: order.discountKobo,
    deliveryFeeKobo: order.deliveryFeeKobo,
    totalKobo: order.totalKobo,
    currency: order.currency,
    deliveryMethod: order.deliveryMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    statusHistory: order.statusHistory.map((history) => ({
      status: history.status,
      note: history.note,
      changedAt: history.changedAt,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * @openapi
 * /api/v1/orders/my:
 *   get:
 *     tags: [Orders]
 *     summary: List orders for the authenticated customer
 *     responses:
 *       200:
 *         description: Customer orders returned
 */
ordersRouter.get("/orders/my", requireAuth, async (request, response, next) => {
  try {
    const orders = await Order.find({ userId: request.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    response.json({ data: { items: orders.map(publicOrder) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/orders/track:
 *   get:
 *     tags: [Orders]
 *     summary: Track an order with order number and customer email
 *     responses:
 *       200:
 *         description: Order tracking details returned
 */
ordersRouter.get("/orders/track", async (request, response, next) => {
  try {
    const input = trackOrderSchema.parse(request.query);
    const order = await Order.findOne({ orderNumber: input.orderNumber, "customer.email": input.email }).lean();
    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "We could not find an order with those details.");
    }

    response.json({ data: { order: publicOrder(order) } });
  } catch (error) {
    next(error);
  }
});