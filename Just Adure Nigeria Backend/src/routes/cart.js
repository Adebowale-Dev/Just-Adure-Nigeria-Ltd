import { randomUUID } from "node:crypto";
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { authCookieNames } from "../middleware/auth.js";
import { Cart } from "../models/cart.js";
import { Product } from "../models/catalogue.js";
import { verifyToken } from "../utils/token.js";
export const cartRouter = Router();
const cartCookieName = "ja_cart_id";
const guestCartMaxAgeMs = 30 * 24 * 60 * 60 * 1000;
const addItemSchema = z.object({
    productId: z.string().trim().refine((value) => !value || mongoose.Types.ObjectId.isValid(value), "Invalid product ID.").optional(),
    slug: z.string().trim().optional(),
    quantity: z.coerce.number().int().min(1).max(20).default(1),
}).refine((value) => Boolean(value.productId || value.slug), {
    message: "Provide either productId or slug.",
    path: ["productId"],
});
const updateItemSchema = z.object({
    quantity: z.coerce.number().int().min(1).max(20),
});
const productIdParamSchema = z.object({ productId: z.string().trim().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid product ID.") });
function cookieOptions() {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: guestCartMaxAgeMs,
        path: "/",
    };
}
function getUserIdFromAccessCookie(request) {
    const token = request.cookies?.[authCookieNames.access];
    if (!token) {
        return null;
    }
    try {
        return verifyToken(token, env.JWT_ACCESS_SECRET, "access").sub;
    }
    catch {
        return null;
    }
}
function ensureGuestCartKey(request, response) {
    const existing = request.cookies?.[cartCookieName];
    if (existing) {
        return `guest:${existing}`;
    }
    const guestId = randomUUID();
    response.cookie(cartCookieName, guestId, cookieOptions());
    return `guest:${guestId}`;
}
function getCartKey(request, response) {
    const userId = getUserIdFromAccessCookie(request);
    if (userId) {
        return { cartKey: `user:${userId}`, userId };
    }
    return { cartKey: ensureGuestCartKey(request, response), userId: null };
}
async function getOrCreateCart(request, response) {
    const { cartKey, userId } = getCartKey(request, response);
    const expiresAt = userId ? undefined : new Date(Date.now() + guestCartMaxAgeMs);
    const cart = await Cart.findOneAndUpdate({ cartKey }, { $setOnInsert: { cartKey, userId: userId ? new mongoose.Types.ObjectId(userId) : undefined, items: [], expiresAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    return cart;
}
function productAvailableQuantity(product) {
    return Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
}
function assertProductCanBePurchased(product, quantity) {
    if (product.isArchived || product.availability === "archived") {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "The requested product was not found.");
    }
    const availableQuantity = productAvailableQuantity(product);
    if (availableQuantity <= 0 || product.availability === "out_of_stock") {
        throw new AppError(409, "PRODUCT_SOLD_OUT", "This product is currently sold out.");
    }
    if (quantity > availableQuantity) {
        throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${availableQuantity} unit(s) are available.`);
    }
}
async function findProduct(input) {
    const filter = input.productId
        ? { _id: input.productId }
        : { slug: input.slug };
    const product = await Product.findOne(filter).lean();
    if (!product) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "The requested product was not found.");
    }
    return product;
}
async function populateCart(cartId) {
    return Cart.findById(cartId).populate("items.productId").lean();
}
function serializeCart(cart) {
    const items = (cart?.items ?? [])
        .filter((item) => item.productId)
        .map((item) => {
        const product = item.productId;
        const quantity = Number(item.quantity);
        const lineSubtotalKobo = Number(product.priceKobo) * quantity;
        const availableQuantity = productAvailableQuantity(product);
        const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0] ?? null;
        return {
            productId: String(product._id),
            slug: product.slug,
            name: product.name,
            sku: product.sku,
            quantity,
            unitPriceKobo: product.priceKobo,
            lineSubtotalKobo,
            availableQuantity,
            isSoldOut: availableQuantity <= 0 || product.availability === "out_of_stock",
            condition: product.conditionGradeId?.name ?? null,
            image: primaryImage,
        };
    });
    const subtotalKobo = items.reduce((total, item) => total + item.lineSubtotalKobo, 0);
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    return {
        id: cart?._id ? String(cart._id) : null,
        currency: "NGN",
        items,
        itemCount,
        subtotalKobo,
        discountKobo: 0,
        deliveryFeeKobo: 0,
        totalKobo: subtotalKobo,
    };
}
/**
 * @openapi
 * /api/v1/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the current guest or customer cart
 *     responses:
 *       200:
 *         description: Cart returned
 */
cartRouter.get("/cart", async (request, response, next) => {
    try {
        const cart = await getOrCreateCart(request, response);
        const populated = await populateCart(cart?._id);
        response.json({ data: { cart: serializeCart(populated) } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add a product to the current cart
 *     responses:
 *       200:
 *         description: Cart updated
 */
cartRouter.post("/cart/items", async (request, response, next) => {
    try {
        const input = addItemSchema.parse(request.body);
        const product = await findProduct(input);
        const cart = await getOrCreateCart(request, response);
        const existingItem = cart.items.find((item) => String(item.productId) === String(product._id));
        const nextQuantity = Number(existingItem?.quantity ?? 0) + input.quantity;
        assertProductCanBePurchased(product, nextQuantity);
        if (existingItem) {
            existingItem.quantity = nextQuantity;
        }
        else {
            cart.items.push({ productId: product._id, quantity: input.quantity, addedAt: new Date() });
        }
        await cart.save();
        const populated = await populateCart(cart._id);
        response.json({ data: { cart: serializeCart(populated) } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/cart/items/{productId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update a cart item quantity
 *     responses:
 *       200:
 *         description: Cart updated
 */
cartRouter.patch("/cart/items/:productId", async (request, response, next) => {
    try {
        const { productId } = productIdParamSchema.parse(request.params);
        const input = updateItemSchema.parse(request.body);
        const product = await Product.findById(productId).lean();
        if (!product) {
            throw new AppError(404, "PRODUCT_NOT_FOUND", "The requested product was not found.");
        }
        assertProductCanBePurchased(product, input.quantity);
        const cart = await getOrCreateCart(request, response);
        const existingItem = cart.items.find((item) => String(item.productId) === productId);
        if (!existingItem) {
            throw new AppError(404, "CART_ITEM_NOT_FOUND", "This product is not in your cart.");
        }
        existingItem.quantity = input.quantity;
        await cart.save();
        const populated = await populateCart(cart._id);
        response.json({ data: { cart: serializeCart(populated) } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/cart/items/{productId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove a product from the current cart
 *     responses:
 *       200:
 *         description: Cart updated
 */
cartRouter.delete("/cart/items/:productId", async (request, response, next) => {
    try {
        const { productId } = productIdParamSchema.parse(request.params);
        const cart = await getOrCreateCart(request, response);
        cart.items.pull({ productId });
        await cart.save();
        const populated = await populateCart(cart._id);
        response.json({ data: { cart: serializeCart(populated) } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear the current cart
 *     responses:
 *       200:
 *         description: Cart cleared
 */
cartRouter.delete("/cart", async (request, response, next) => {
    try {
        const cart = await getOrCreateCart(request, response);
        cart.items.splice(0, cart.items.length);
        await cart.save();
        const populated = await populateCart(cart._id);
        response.json({ data: { cart: serializeCart(populated) } });
    }
    catch (error) {
        next(error);
    }
});
