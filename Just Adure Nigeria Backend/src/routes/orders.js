import { Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "../middleware/auth.js";
import { Product } from "../models/catalogue.js";
import { Order } from "../models/order.js";
import { Payment } from "../models/payment.js";

export const ordersRouter = Router();

const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(4).max(80),
  email: z.string().trim().email().toLowerCase(),
});

const cancelOrderSchema = z.object({
  reason: z.string().trim().max(300).optional(),
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

function ensureMongoId(id) {
  if (!id.match(/^[a-f\d]{24}$/i)) {
    throw new AppError(404, "ORDER_NOT_FOUND", "We could not find that order on your account.");
  }
}

function availabilityForProduct(product) {
  const available = Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
  if (product.isArchived) return "archived";
  if (available <= 0) return "out_of_stock";
  if (available <= Number(product.lowStockThreshold ?? 1)) return "low_stock";
  return "in_stock";
}

async function releaseOrderReservations(order) {
  const activeReservations = order.reservations.filter((reservation) => !reservation.releasedAt);
  for (const reservation of activeReservations) {
    const product = await Product.findById(reservation.productId);
    if (!product) continue;
    product.reservedQuantity = Math.max(0, Number(product.reservedQuantity ?? 0) - Number(reservation.quantity ?? 0));
    product.availability = availabilityForProduct(product);
    await product.save();
    reservation.releasedAt = new Date();
  }
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
 * /api/v1/orders/my/{orderId}:
 *   get:
 *     tags: [Orders]
 *     summary: Get one authenticated customer's order by ID
 *     responses:
 *       200:
 *         description: Customer order returned
 *       404:
 *         description: Order not found for this customer
 */
ordersRouter.get("/orders/my/:orderId", requireAuth, async (request, response, next) => {
  try {
    ensureMongoId(request.params.orderId);
    const order = await Order.findOne({ _id: request.params.orderId, userId: request.user.id }).lean();
    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "We could not find that order on your account.");
    }
    response.json({ data: { order: publicOrder(order) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/orders/my/{orderId}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel an unpaid pending customer order
 *     responses:
 *       200:
 *         description: Order cancelled
 *       409:
 *         description: Order cannot be cancelled by customer
 */
ordersRouter.patch("/orders/my/:orderId/cancel", requireAuth, async (request, response, next) => {
  try {
    ensureMongoId(request.params.orderId);
    const input = cancelOrderSchema.parse(request.body);
    const order = await Order.findOne({ _id: request.params.orderId, userId: request.user.id });
    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "We could not find that order on your account.");
    }
    if (order.orderStatus === "cancelled") {
      response.json({ data: { order: publicOrder(order), message: "Order is already cancelled." } });
      return;
    }
    if (order.orderStatus !== "pending_payment" || order.paymentStatus !== "pending") {
      throw new AppError(409, "ORDER_CANCELLATION_NOT_ALLOWED", "This order can no longer be cancelled from the customer dashboard. Please contact support.");
    }

    await releaseOrderReservations(order);
    order.orderStatus = "cancelled";
    order.paymentStatus = "abandoned";
    order.statusHistory.push({ status: "cancelled", note: input.reason || "Cancelled by customer before payment." });
    await order.save();
    await Payment.updateMany({ orderId: order._id, status: "pending" }, { $set: { status: "abandoned", gatewayResponse: "Cancelled by customer before payment." } });

    response.json({ data: { order: publicOrder(order), message: "Order cancelled successfully." } });
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
