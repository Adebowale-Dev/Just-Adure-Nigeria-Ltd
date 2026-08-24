import { Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "../middleware/auth.js";
import { BackInStockAlert } from "../models/back-in-stock-alert.js";
import { Product } from "../models/catalogue.js";
import { User } from "../models/user.js";
import { serializeBackInStockAlert } from "../services/back-in-stock-alerts.js";

export const stockAlertsRouter = Router();

const stockAlertSchema = z.object({
  productId: z.string().trim().optional(),
  slug: z.string().trim().optional(),
}).refine((value) => Boolean(value.productId || value.slug), {
  message: "Provide either productId or slug.",
  path: ["productId"],
});

async function findProduct(input) {
  const product = await Product.findOne(input.productId ? { _id: input.productId } : { slug: input.slug }).lean();
  if (!product || product.isArchived || product.availability === "archived") {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "The requested product was not found.");
  }
  return product;
}

/**
 * @openapi
 * /api/v1/stock-alerts:
 *   post:
 *     tags: [Wishlist]
 *     summary: Subscribe the logged-in customer to a back-in-stock alert
 *     responses:
 *       200:
 *         description: Back-in-stock alert saved
 */
stockAlertsRouter.post("/stock-alerts", requireAuth, async (request, response, next) => {
  try {
    const input = stockAlertSchema.parse(request.body);
    const [product, user] = await Promise.all([findProduct(input), User.findById(request.user.id).lean()]);
    if (!user) throw new AppError(401, "AUTH_REQUIRED", "Please log in to continue.");

    const alert = await BackInStockAlert.findOneAndUpdate(
      { userId: user._id, productId: product._id, status: "active" },
      { $setOnInsert: { userId: user._id, productId: product._id, email: user.email, status: "active" } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    response.json({ data: { alert: serializeBackInStockAlert(alert) } });
  } catch (error) {
    next(error);
  }
});