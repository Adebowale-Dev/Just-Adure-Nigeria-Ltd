import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "../middleware/auth.js";
import { Cart } from "../models/cart.js";
import { Product } from "../models/catalogue.js";
import { Wishlist } from "../models/wishlist.js";

export const wishlistRouter = Router();

const addWishlistSchema = z.object({
  productId: z.string().trim().optional(),
  slug: z.string().trim().optional(),
}).refine((value) => Boolean(value.productId || value.slug), {
  message: "Provide either productId or slug.",
  path: ["productId"],
});

const productIdParamSchema = z.object({ productId: z.string().trim().min(1) });

function availableQuantity(product) {
  return Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
}

function primaryImage(product) {
  return product.images?.find((image) => image.isPrimary) ?? product.images?.[0] ?? null;
}

function serializeWishlist(wishlist) {
  const items = (wishlist?.items ?? [])
    .filter((item) => item.productId)
    .map((item) => {
      const product = item.productId;
      const available = availableQuantity(product);
      return {
        productId: String(product._id),
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        priceKobo: product.priceKobo,
        previousPriceKobo: product.previousPriceKobo ?? null,
        condition: product.conditionGradeId?.name ?? "UK-used",
        visibleDefects: product.visibleDefects ?? "No major defect listed.",
        image: primaryImage(product),
        availableQuantity: available,
        isSoldOut: available <= 0 || product.availability === "out_of_stock",
        addedAt: item.addedAt,
      };
    });

  return {
    id: wishlist?._id ? String(wishlist._id) : null,
    itemCount: items.length,
    items,
  };
}

async function getOrCreateWishlist(userId) {
  return Wishlist.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $setOnInsert: { userId: new mongoose.Types.ObjectId(userId), items: [] } },
    { upsert: true, returnDocument: "after", runValidators: true },
  );
}

async function populateWishlist(wishlistId) {
  return Wishlist.findById(wishlistId)
    .populate({ path: "items.productId", populate: [{ path: "conditionGradeId" }] })
    .lean();
}

async function findProduct(input) {
  const product = await Product.findOne(input.productId ? { _id: input.productId } : { slug: input.slug }).lean();
  if (!product || product.isArchived || product.availability === "archived") {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "The requested product was not found.");
  }
  return product;
}

function assertCanMoveToCart(product) {
  const available = availableQuantity(product);
  if (available <= 0 || product.availability === "out_of_stock") {
    throw new AppError(409, "PRODUCT_SOLD_OUT", "This wishlist product is currently sold out.");
  }
}

async function addProductToUserCart(userId, product) {
  const cartKey = `user:${userId}`;
  const cart = await Cart.findOneAndUpdate(
    { cartKey },
    { $setOnInsert: { cartKey, userId: new mongoose.Types.ObjectId(userId), items: [] } },
    { upsert: true, returnDocument: "after", runValidators: true },
  );
  const existingItem = cart.items.find((item) => String(item.productId) === String(product._id));
  const nextQuantity = Number(existingItem?.quantity ?? 0) + 1;
  if (nextQuantity > availableQuantity(product)) {
    throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${availableQuantity(product)} unit(s) are available.`);
  }
  if (existingItem) {
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({ productId: product._id, quantity: 1, addedAt: new Date() });
  }
  await cart.save();
}

/**
 * @openapi
 * /api/v1/wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get the logged-in customer's wishlist
 *     responses:
 *       200:
 *         description: Wishlist returned
 */
wishlistRouter.get("/wishlist", requireAuth, async (request, response, next) => {
  try {
    const wishlist = await getOrCreateWishlist(request.user.id);
    const populated = await populateWishlist(wishlist._id);
    response.json({ data: { wishlist: serializeWishlist(populated) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/wishlist/items:
 *   post:
 *     tags: [Wishlist]
 *     summary: Add a product to the logged-in customer's wishlist
 *     responses:
 *       200:
 *         description: Wishlist updated
 */
wishlistRouter.post("/wishlist/items", requireAuth, async (request, response, next) => {
  try {
    const input = addWishlistSchema.parse(request.body);
    const product = await findProduct(input);
    const wishlist = await getOrCreateWishlist(request.user.id);
    const exists = wishlist.items.some((item) => String(item.productId) === String(product._id));
    if (!exists) {
      wishlist.items.push({ productId: product._id, addedAt: new Date() });
      await wishlist.save();
    }
    const populated = await populateWishlist(wishlist._id);
    response.json({ data: { wishlist: serializeWishlist(populated) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/wishlist/items/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove a product from the logged-in customer's wishlist
 *     responses:
 *       200:
 *         description: Wishlist updated
 */
wishlistRouter.delete("/wishlist/items/:productId", requireAuth, async (request, response, next) => {
  try {
    const { productId } = productIdParamSchema.parse(request.params);
    const wishlist = await getOrCreateWishlist(request.user.id);
    wishlist.items.pull({ productId });
    await wishlist.save();
    const populated = await populateWishlist(wishlist._id);
    response.json({ data: { wishlist: serializeWishlist(populated) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/wishlist/items/{productId}/move-to-cart:
 *   post:
 *     tags: [Wishlist]
 *     summary: Move a wishlist product into the customer's cart
 *     responses:
 *       200:
 *         description: Product moved to cart and wishlist updated
 */
wishlistRouter.post("/wishlist/items/:productId/move-to-cart", requireAuth, async (request, response, next) => {
  try {
    const { productId } = productIdParamSchema.parse(request.params);
    const wishlist = await getOrCreateWishlist(request.user.id);
    const exists = wishlist.items.some((item) => String(item.productId) === productId);
    if (!exists) {
      throw new AppError(404, "WISHLIST_ITEM_NOT_FOUND", "This product is not in your wishlist.");
    }
    const product = await Product.findById(productId).lean();
    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "The requested product was not found.");
    }
    assertCanMoveToCart(product);
    await addProductToUserCart(request.user.id, product);
    wishlist.items.pull({ productId });
    await wishlist.save();
    const populated = await populateWishlist(wishlist._id);
    response.json({ data: { wishlist: serializeWishlist(populated), movedToCart: true } });
  } catch (error) {
    next(error);
  }
});