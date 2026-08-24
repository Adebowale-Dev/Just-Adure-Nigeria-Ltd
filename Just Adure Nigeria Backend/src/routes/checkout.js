import { randomUUID } from "node:crypto";
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { authCookieNames } from "../middleware/auth.js";
import { Cart } from "../models/cart.js";
import { DeliveryZone, Product } from "../models/catalogue.js";
import { Order } from "../models/order.js";
import { applyCouponToTotals, serializeCoupon } from "../services/coupons.js";
import { notifyOrderReceived } from "../services/email.js";
import { notifyAdmins, notifyCustomer } from "../services/notifications.js";
import { verifyToken } from "../utils/token.js";

export const checkoutRouter = Router();

const cartCookieName = "ja_cart_id";

const nigerianPhoneSchema = z
  .string()
  .trim()
  .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number.");

const addressSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  phone: nigerianPhoneSchema,
  addressLine1: z.string().trim().min(5).max(220),
  addressLine2: z.string().trim().max(220).optional(),
  state: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(120),
  deliveryInstructions: z.string().trim().max(300).optional(),
});

const deliveryFeeSchema = z.object({
  state: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(120).optional(),
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
});

const checkoutSchema = z.object({
  customer: addressSchema,
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  couponCode: z.string().trim().max(60).transform((value) => value || undefined).optional(),
  orderNotes: z.string().trim().max(500).optional(),
});

function getUserIdFromAccessCookie(request) {
  const token = request.cookies?.[authCookieNames.access];
  if (!token) return null;
  try {
    return verifyToken(token, env.JWT_ACCESS_SECRET, "access").sub;
  } catch {
    return null;
  }
}

function getCartKey(request) {
  const userId = getUserIdFromAccessCookie(request);
  if (userId) return { cartKey: `user:${userId}`, userId };

  const guestId = request.cookies?.[cartCookieName];
  if (!guestId) throw new AppError(400, "CART_NOT_FOUND", "Your cart is empty.");
  return { cartKey: `guest:${guestId}`, userId: null };
}

async function getCurrentCart(request) {
  const { cartKey, userId } = getCartKey(request);
  const cart = await Cart.findOne({ cartKey }).populate("items.productId");
  if (!cart || cart.items.length === 0) {
    throw new AppError(400, "EMPTY_CART", "Add at least one product before checkout.");
  }
  return { cart, userId };
}

async function findDeliveryZone({ state, city, deliveryMethod }) {
  if (deliveryMethod === "pickup") {
    return { zone: null, deliveryFeeKobo: 0 };
  }

  const zones = await DeliveryZone.find({ state: new RegExp(`^${escapeRegExp(state)}$`, "i"), isActive: true })
    .sort({ priority: -1 })
    .lean();

  const zone = zones.find((candidate) => {
    if (!candidate.cityPattern || !city) return true;
    return new RegExp(candidate.cityPattern, "i").test(city);
  });

  if (!zone) {
    throw new AppError(400, "DELIVERY_LOCATION_UNAVAILABLE", "Delivery is not available for this location yet.");
  }

  return { zone, deliveryFeeKobo: zone.feeKobo };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function productAvailableQuantity(product) {
  return Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
}

function snapshotCartItem(item) {
  const product = item.productId;
  const quantity = Number(item.quantity);
  const availableQuantity = productAvailableQuantity(product);

  if (product.isArchived || product.availability === "archived") {
    throw new AppError(404, "PRODUCT_NOT_FOUND", `${product.name} is no longer available.`);
  }

  if (availableQuantity <= 0 || product.availability === "out_of_stock") {
    throw new AppError(409, "PRODUCT_SOLD_OUT", `${product.name} is sold out.`);
  }

  if (quantity > availableQuantity) {
    throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${availableQuantity} unit(s) of ${product.name} are available.`);
  }

  const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0] ?? null;
  const unitPriceKobo = Number(product.priceKobo);

  return {
    productId: product._id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    condition: product.conditionGradeId?.name ?? undefined,
    imageUrl: primaryImage?.secureUrl,
    unitPriceKobo,
    quantity,
    lineSubtotalKobo: unitPriceKobo * quantity,
  };
}

async function reserveProducts(items, expiresAt) {
  const reserved = [];
  try {
    for (const item of items) {
      const result = await Product.updateOne(
        {
          _id: item.productId,
          isArchived: false,
          availability: { $nin: ["out_of_stock", "archived"] },
          $expr: { $gte: [{ $subtract: ["$stockQuantity", "$reservedQuantity"] }, item.quantity] },
        },
        { $inc: { reservedQuantity: item.quantity } },
      );

      if (result.modifiedCount !== 1) {
        throw new AppError(409, "INSUFFICIENT_STOCK", `${item.name} is no longer available in the requested quantity.`);
      }

      reserved.push({ productId: item.productId, quantity: item.quantity, expiresAt });
    }
  } catch (error) {
    await releaseReservations(reserved);
    throw error;
  }

  return reserved;
}

async function releaseReservations(reservations) {
  await Promise.all(
    reservations.map((reservation) =>
      Product.updateOne(
        { _id: reservation.productId },
        { $inc: { reservedQuantity: -reservation.quantity } },
      ),
    ),
  );
}

function createOrderNumber() {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `JAN-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/**
 * @openapi
 * /api/v1/checkout/delivery-fee:
 *   post:
 *     tags: [Checkout]
 *     summary: Calculate delivery fee from backend delivery zones
 *     responses:
 *       200:
 *         description: Delivery fee returned
 */
checkoutRouter.post("/checkout/delivery-fee", async (request, response, next) => {
  try {
    const input = deliveryFeeSchema.parse(request.body);
    const { zone, deliveryFeeKobo } = await findDeliveryZone(input);
    response.json({
      data: {
        deliveryFeeKobo,
        currency: "NGN",
        zone: zone
          ? {
              id: String(zone._id),
              name: zone.name,
              state: zone.state,
              minDeliveryDays: zone.minDeliveryDays,
              maxDeliveryDays: zone.maxDeliveryDays,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/checkout:
 *   post:
 *     tags: [Checkout]
 *     summary: Create a pending order and reserve inventory before payment
 *     responses:
 *       201:
 *         description: Pending order created
 */
checkoutRouter.post("/checkout", async (request, response, next) => {
  try {
    const input = checkoutSchema.parse(request.body);
    const { cart, userId } = await getCurrentCart(request);
    const { zone, deliveryFeeKobo } = await findDeliveryZone({
      state: input.customer.state,
      city: input.customer.city,
      deliveryMethod: input.deliveryMethod,
    });

    const items = cart.items.map(snapshotCartItem);
    const subtotalKobo = items.reduce((total, item) => total + item.lineSubtotalKobo, 0);
    const { coupon, discountKobo } = await applyCouponToTotals({
      couponCode: input.couponCode,
      items,
      subtotalKobo,
      userId,
      customerEmail: input.customer.email,
    });
    const totalKobo = subtotalKobo - discountKobo + deliveryFeeKobo;
    const expiresAt = new Date(Date.now() + env.STOCK_RESERVATION_MINUTES * 60 * 1000);
    const reservations = await reserveProducts(items, expiresAt);

    const order = await Order.create({
      orderNumber: createOrderNumber(),
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      customer: input.customer,
      items,
      subtotalKobo,
      discountKobo,
      couponId: coupon?._id,
      couponCode: coupon?.code,
      deliveryFeeKobo,
      totalKobo,
      currency: "NGN",
      deliveryZoneId: zone?._id,
      deliveryMethod: input.deliveryMethod,
      paymentStatus: "pending",
      orderStatus: "pending_payment",
      statusHistory: [{ status: "pending_payment", note: "Order created and inventory reserved." }],
      reservations,
      customerNotes: input.orderNotes,
    });

    cart.items.splice(0, cart.items.length);
    await cart.save();

    await notifyOrderReceived(order);
    await notifyCustomer(userId, { type: "order", title: "Order created", message: `Your order ${order.orderNumber} is awaiting payment.`, resourceType: "order", resourceId: String(order._id), actionUrl: `/order-tracking?orderNumber=${encodeURIComponent(order.orderNumber)}` });
    await notifyAdmins({ type: "order", title: "New order awaiting payment", message: `${order.customer.email} created order ${order.orderNumber}.`, resourceType: "order", resourceId: String(order._id), actionUrl: "/admin" });

    response.status(201).json({
      data: {
        order: {
          id: String(order._id),
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          currency: order.currency,
          subtotalKobo: order.subtotalKobo,
          discountKobo: order.discountKobo,
          coupon: coupon ? serializeCoupon(coupon) : null,
          deliveryFeeKobo: order.deliveryFeeKobo,
          totalKobo: order.totalKobo,
          reservationExpiresAt: expiresAt,
          items: order.items,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
