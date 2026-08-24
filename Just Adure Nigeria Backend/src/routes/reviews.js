import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { Product } from "../models/catalogue.js";
import { Order } from "../models/order.js";
import { Review } from "../models/review.js";
import { User } from "../models/user.js";
import { notifyAdmins } from "../services/notifications.js";

export const reviewsRouter = Router();

const objectIdSchema = z.string().trim().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid ID.");
const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  comment: z.string().trim().min(5).max(1000),
  imageUrl: z.string().trim().url().optional(),
});

export function serializeReview(review) {
  return {
    id: String(review._id),
    productId: String(review.productId?._id ?? review.productId),
    productName: review.productId?.name,
    customerName: review.customerName,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    imageUrl: review.imageUrl ?? null,
    status: review.status,
    isVerifiedPurchase: review.isVerifiedPurchase,
    adminReply: review.adminReply ?? null,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

async function hasVerifiedPurchase({ productId, userId, email }) {
  const buyerFilter = userId ? { userId } : { "customer.email": email };
  const order = await Order.findOne({
    ...buyerFilter,
    paymentStatus: "successful",
    "items.productId": productId,
  })
    .select("_id")
    .lean();
  return Boolean(order);
}

/**
 * @openapi
 * /api/v1/products/{productId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List approved product reviews
 *     responses:
 *       200:
 *         description: Product reviews returned
 */
reviewsRouter.get("/products/:productId/reviews", async (request, response, next) => {
  try {
    const { productId } = z.object({ productId: objectIdSchema }).parse(request.params);
    const reviews = await Review.find({ productId, status: "approved" }).sort({ createdAt: -1 }).limit(50).lean();
    response.json({ data: { items: reviews.map(serializeReview) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/products/{productId}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Submit a product review for moderation
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Review submitted
 */
reviewsRouter.post("/products/:productId/reviews", requireAuth, requireRoles("customer", "admin", "super_admin"), async (request, response, next) => {
  try {
    const { productId } = z.object({ productId: objectIdSchema }).parse(request.params);
    const input = createReviewSchema.parse(request.body);
    const [product, user] = await Promise.all([
      Product.findOne({ _id: productId, isArchived: false }).select("_id").lean(),
      User.findById(request.user.id).select("name email").lean(),
    ]);
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    if (!user) throw new AppError(401, "AUTH_REQUIRED", "Please log in to continue.");

    const verified = await hasVerifiedPurchase({ productId, userId: request.user.id, email: user.email });
    const review = await Review.findOneAndUpdate(
      { productId, userId: request.user.id },
      {
        $set: {
          ...input,
          customerName: user.name,
          customerEmail: user.email,
          status: "pending",
          isVerifiedPurchase: verified,
        },
        $setOnInsert: { productId, userId: request.user.id },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    await notifyAdmins({ type: "review", title: "Review pending moderation", message: `${user.email} submitted a review for moderation.`, resourceType: "review", resourceId: String(review._id), actionUrl: "/admin" });

    response.status(201).json({ data: { review: serializeReview(review) } });
  } catch (error) {
    next(error);
  }
});