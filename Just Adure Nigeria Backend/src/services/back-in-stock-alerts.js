import { logger } from "../config/logger.js";
import { BackInStockAlert } from "../models/back-in-stock-alert.js";
import { notifyBackInStockEmail } from "./email.js";
import { notifyCustomer } from "./notifications.js";

function availableQuantity(product) {
  return Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
}

export function serializeBackInStockAlert(alert) {
  return {
    id: String(alert._id),
    productId: String(alert.productId?._id ?? alert.productId),
    email: alert.email,
    status: alert.status,
    notifiedAt: alert.notifiedAt ?? null,
    createdAt: alert.createdAt,
  };
}

export async function processBackInStockAlerts(product) {
  if (!product || availableQuantity(product) <= 0 || product.availability === "out_of_stock") return { notifiedCount: 0 };

  const alerts = await BackInStockAlert.find({ productId: product._id, status: "active" }).populate("userId");
  if (alerts.length === 0) return { notifiedCount: 0 };

  let notifiedCount = 0;
  for (const alert of alerts) {
    try {
      await notifyCustomer(alert.userId?._id, {
        type: "inventory",
        title: "Product back in stock",
        message: `${product.name} is available again. Buy it before it sells out.` ,
        resourceType: "product",
        resourceId: String(product._id),
        actionUrl: `/product/${product.slug}`,
      });
      await notifyBackInStockEmail(alert.userId, product);
      alert.status = "notified";
      alert.notifiedAt = new Date();
      await alert.save();
      notifiedCount += 1;
    } catch (error) {
      logger.error({ err: error, alertId: alert._id, productId: product._id }, "Back-in-stock notification failed.");
    }
  }

  return { notifiedCount };
}