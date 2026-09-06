import { randomUUID } from "node:crypto";
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { optionalAuth } from "../middleware/auth.js";
import { Order } from "../models/order.js";
import { ReturnRequest, returnReasons } from "../models/return-request.js";
import { notifyAdmins } from "../services/notifications.js";

export const returnsRouter = Router();

const objectIdSchema = z.string().trim().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid ID.");
const returnRequestSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  reason: z.enum(returnReasons),
  details: z.string().trim().min(10).max(1000),
  items: z.array(z.object({ sku: z.string().trim().min(1), quantity: z.coerce.number().int().min(1) })).optional(),
});

function createReturnNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `RET-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function serializeReturnRequest(request) {
  return {
    id: String(request._id),
    requestNumber: request.requestNumber,
    orderId: String(request.orderId?._id ?? request.orderId),
    orderNumber: request.orderNumber,
    customerName: request.customerName,
    customerEmail: request.customerEmail,
    reason: request.reason,
    details: request.details,
    items: request.items,
    status: request.status,
    adminNote: request.adminNote ?? null,
    refundAmountKobo: request.refundAmountKobo ?? null,
    refundReference: request.refundReference ?? null,
    refundProcessedAt: request.refundProcessedAt ?? null,
    resolvedAt: request.resolvedAt ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function selectedItems(order, requestedItems) {
  if (!requestedItems?.length) return order.items.map((item) => ({ productId: item.productId, sku: item.sku, name: item.name, quantity: item.quantity }));

  return requestedItems.map((requested) => {
    const item = order.items.find((orderItem) => orderItem.sku === requested.sku);
    if (!item) throw new AppError(400, "RETURN_ITEM_NOT_FOUND", `Order item ${requested.sku} was not found.`);
    if (requested.quantity > item.quantity) throw new AppError(400, "RETURN_QUANTITY_INVALID", `Only ${item.quantity} unit(s) of ${requested.sku} can be returned.`);
    return { productId: item.productId, sku: item.sku, name: item.name, quantity: requested.quantity };
  });
}

/**
 * @openapi
 * /api/v1/orders/{orderId}/returns:
 *   post:
 *     tags: [Returns]
 *     summary: Submit a return or refund request for an order
 *     responses:
 *       201:
 *         description: Return request submitted
 */
returnsRouter.post("/orders/:orderId/returns", optionalAuth, async (request, response, next) => {
  try {
    const { orderId } = z.object({ orderId: objectIdSchema }).parse(request.params);
    const input = returnRequestSchema.parse(request.body);
    const order = await Order.findOne({ _id: orderId, "customer.email": input.email });
    if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "We could not find an order with those details.");
    if (request.user?.id && order.userId && String(order.userId) !== request.user.id) {
      throw new AppError(403, "ORDER_ACCESS_DENIED", "This return request does not belong to your account.");
    }
    if (order.paymentStatus !== "successful") throw new AppError(409, "ORDER_NOT_PAID", "Only paid orders can be returned or refunded.");
    if (!["delivered", "returned", "refunded"].includes(order.orderStatus)) {
      throw new AppError(409, "ORDER_NOT_RETURNABLE", "This order is not eligible for a return request yet.");
    }

    const existingOpenRequest = await ReturnRequest.findOne({ orderId: order._id, status: { $in: ["requested", "under_review", "approved"] } }).lean();
    if (existingOpenRequest) throw new AppError(409, "RETURN_ALREADY_OPEN", "There is already an open return request for this order.");

    const returnRequest = await ReturnRequest.create({
      requestNumber: createReturnNumber(),
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      reason: input.reason,
      details: input.details,
      items: selectedItems(order, input.items),
      status: "requested",
    });

    order.orderStatus = "return_requested";
    order.statusHistory.push({ status: "return_requested", note: `Return request ${returnRequest.requestNumber} submitted.` });
    await order.save();
    await notifyAdmins({ type: "return", title: "New return request", message: `${order.customer.email} submitted ${returnRequest.requestNumber}.`, resourceType: "return", resourceId: String(returnRequest._id), actionUrl: "/admin" });

    response.status(201).json({ data: { returnRequest: serializeReturnRequest(returnRequest) } });
  } catch (error) {
    next(error);
  }
});

