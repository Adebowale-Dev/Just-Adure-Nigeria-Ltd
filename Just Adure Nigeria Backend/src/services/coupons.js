import { AppError } from "../errors/app-error.js";
import { Product } from "../models/catalogue.js";
import { Coupon } from "../models/coupon.js";
import { Order } from "../models/order.js";

export function normalizeCouponCode(code) {
  return String(code ?? "").trim().toUpperCase();
}

export function serializeCoupon(coupon) {
  return {
    id: String(coupon._id),
    code: coupon.code,
    name: coupon.name,
    description: coupon.description ?? null,
    type: coupon.type,
    valueKobo: coupon.valueKobo ?? null,
    percentage: coupon.percentage ?? null,
    minOrderAmountKobo: coupon.minOrderAmountKobo,
    maxDiscountKobo: coupon.maxDiscountKobo ?? null,
    usageLimit: coupon.usageLimit ?? null,
    usageLimitPerCustomer: coupon.usageLimitPerCustomer ?? null,
    usedCount: coupon.usedCount,
    startsAt: coupon.startsAt ?? null,
    expiresAt: coupon.expiresAt ?? null,
    isActive: coupon.isActive,
    firstOrderOnly: coupon.firstOrderOnly,
    productIds: (coupon.productIds ?? []).map(String),
    categoryIds: (coupon.categoryIds ?? []).map(String),
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

async function customerOrderCount({ userId, customerEmail }) {
  const filters = [];
  if (userId) filters.push({ userId });
  if (customerEmail) filters.push({ "customer.email": customerEmail });
  if (filters.length === 0) return 0;
  return Order.countDocuments({ $or: filters, paymentStatus: { $in: ["successful", "pending"] } });
}

async function categoryEligibleSubtotal(coupon, items) {
  if (!coupon.categoryIds?.length) return null;
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, categoryId: { $in: coupon.categoryIds } }).select("_id").lean();
  const eligibleProductIds = new Set(products.map((product) => String(product._id)));
  return items
    .filter((item) => eligibleProductIds.has(String(item.productId)))
    .reduce((total, item) => total + Number(item.lineSubtotalKobo), 0);
}

async function eligibleSubtotal(coupon, items, subtotalKobo) {
  const hasProductRules = coupon.productIds?.length > 0;
  const productEligible = hasProductRules
    ? items.filter((item) => coupon.productIds.some((id) => String(id) === String(item.productId))).reduce((total, item) => total + Number(item.lineSubtotalKobo), 0)
    : null;
  const categoryEligible = await categoryEligibleSubtotal(coupon, items);

  if (productEligible !== null && categoryEligible !== null) return Math.max(productEligible, categoryEligible);
  if (productEligible !== null) return productEligible;
  if (categoryEligible !== null) return categoryEligible;
  return subtotalKobo;
}

function calculateDiscount(coupon, eligibleAmountKobo) {
  if (eligibleAmountKobo <= 0) return 0;

  let discountKobo = 0;
  if (coupon.type === "fixed") {
    discountKobo = Number(coupon.valueKobo ?? 0);
  } else {
    discountKobo = Math.floor((eligibleAmountKobo * Number(coupon.percentage ?? 0)) / 100);
  }

  if (coupon.maxDiscountKobo !== undefined && coupon.maxDiscountKobo !== null) {
    discountKobo = Math.min(discountKobo, Number(coupon.maxDiscountKobo));
  }

  return Math.max(0, Math.min(discountKobo, eligibleAmountKobo));
}

export async function applyCouponToTotals({ couponCode, items, subtotalKobo, userId, customerEmail }) {
  const code = normalizeCouponCode(couponCode);
  if (!code) return { coupon: null, discountKobo: 0 };

  const coupon = await Coupon.findOne({ code });
  if (!coupon) throw new AppError(404, "COUPON_NOT_FOUND", "Coupon code was not found.");

  const now = new Date();
  if (!coupon.isActive) throw new AppError(409, "COUPON_DISABLED", "This coupon is not active.");
  if (coupon.startsAt && coupon.startsAt > now) throw new AppError(409, "COUPON_NOT_STARTED", "This coupon is not active yet.");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new AppError(409, "COUPON_EXPIRED", "This coupon has expired.");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError(409, "COUPON_USAGE_LIMIT_REACHED", "This coupon has reached its usage limit.");
  if (subtotalKobo < coupon.minOrderAmountKobo) throw new AppError(409, "COUPON_MINIMUM_NOT_MET", "Your cart does not meet this coupon's minimum order amount.");

  if (coupon.firstOrderOnly || coupon.usageLimitPerCustomer) {
    const orders = await customerOrderCount({ userId, customerEmail });
    if (coupon.firstOrderOnly && orders > 0) throw new AppError(409, "COUPON_FIRST_ORDER_ONLY", "This coupon is only valid on a customer's first order.");
    if (coupon.usageLimitPerCustomer && orders >= coupon.usageLimitPerCustomer) throw new AppError(409, "COUPON_CUSTOMER_LIMIT_REACHED", "You have already used this coupon enough times.");
  }

  const eligibleAmountKobo = await eligibleSubtotal(coupon, items, subtotalKobo);
  const discountKobo = calculateDiscount(coupon, eligibleAmountKobo);
  if (discountKobo <= 0) throw new AppError(409, "COUPON_NOT_APPLICABLE", "This coupon does not apply to the items in your cart.");

  return { coupon, discountKobo };
}

export async function markCouponUsed(couponId) {
  if (!couponId) return;
  await Coupon.updateOne({ _id: couponId }, { $inc: { usedCount: 1 } });
}