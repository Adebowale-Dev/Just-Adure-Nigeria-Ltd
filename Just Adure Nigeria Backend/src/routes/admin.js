import mongoose from "mongoose";
import { Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { requireAuth, requirePermissions, requireRoles } from "../middleware/auth.js";
import { Brand, Category, ConditionGrade, DeliveryZone, Product, productAvailability } from "../models/catalogue.js";
import { Coupon, couponTypes } from "../models/coupon.js";
import { Order, orderStatuses } from "../models/order.js";
import { Payment } from "../models/payment.js";
import { Review, reviewStatuses } from "../models/review.js";
import { ReturnRequest, returnRequestStatuses } from "../models/return-request.js";
import { SupportTicket, supportTicketStatuses } from "../models/support-ticket.js";
import { NewsletterSubscriber, newsletterSubscriberStatuses } from "../models/newsletter-subscriber.js";
import { uploadProductImage } from "../services/cloudinary.js";
import { serializeCoupon } from "../services/coupons.js";
import { serializeReview } from "./reviews.js";
import { serializeReturnRequest } from "./returns.js";
import { serializeSupportTicket } from "./support.js";
import { getStoreSettings, serializeStoreSettings } from "../services/store-settings.js";
import { getHomepageContent, serializeHomepageContent } from "../services/homepage-content.js";
import { AdminActivityLog } from "../models/admin-activity-log.js";
import { logAdminActivity, serializeAdminActivityLog } from "../services/admin-activity-logs.js";
import { notifyCustomer } from "../services/notifications.js";
import { processBackInStockAlerts } from "../services/back-in-stock-alerts.js";
import { User, userRoles } from "../models/user.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRoles("admin", "super_admin", "inventory_manager", "order_manager", "customer_support", "content_manager"));

const objectIdSchema = z.string().trim().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid ID.");
const stockUpdateSchema = z.object({ stockQuantity: z.number().int().min(0), lowStockThreshold: z.number().int().min(0).optional() });
const orderStatusSchema = z.object({ status: z.enum(orderStatuses), note: z.string().trim().max(300).optional() });
const reviewModerationSchema = z.object({ status: z.enum(reviewStatuses), adminReply: z.string().trim().max(1000).optional() });
const returnModerationSchema = z.object({ status: z.enum(returnRequestStatuses), adminNote: z.string().trim().max(1000).optional(), refundAmountKobo: z.coerce.number().int().min(1).optional(), refundReference: z.string().trim().max(120).optional() });
const supportTicketUpdateSchema = z.object({ status: z.enum(supportTicketStatuses), reply: z.string().trim().max(2000).optional(), internalNote: z.string().trim().max(1000).optional() });
const newsletterStatusSchema = z.object({ status: z.enum(newsletterSubscriberStatuses) });
const brandSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  logoUrl: z.string().trim().url().or(z.literal("")).optional(),
  isActive: z.boolean().default(true),
});
const brandUpdateSchema = brandSchema.partial();
const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().url().or(z.literal("")).optional(),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  parentId: objectIdSchema.optional(),
  isActive: z.boolean().default(true),
});
const categoryUpdateSchema = categorySchema.partial();
const conditionGradeSchema = z.object({
  code: z.string().trim().min(2).max(60).transform((value) => value.toLowerCase()),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(500),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
const conditionGradeUpdateSchema = conditionGradeSchema.partial();

const deliveryZoneBaseSchema = z.object({
  code: z.string().trim().min(2).max(60).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(80),
  cityPattern: z.string().trim().max(160).optional(),
  feeKobo: z.number().int().min(0),
  minDeliveryDays: z.number().int().min(1),
  maxDeliveryDays: z.number().int().min(1),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
const deliveryZoneSchema = deliveryZoneBaseSchema.refine((value) => value.maxDeliveryDays >= value.minDeliveryDays, {
  message: "Maximum delivery days must be greater than or equal to minimum delivery days.",
  path: ["maxDeliveryDays"],
});
const deliveryZoneUpdateSchema = deliveryZoneBaseSchema.partial().refine((value) => {
  if (value.minDeliveryDays === undefined || value.maxDeliveryDays === undefined) return true;
  return value.maxDeliveryDays >= value.minDeliveryDays;
}, {
  message: "Maximum delivery days must be greater than or equal to minimum delivery days.",
  path: ["maxDeliveryDays"],
});
const homepageBannerSchema = z.object({
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(300).optional(),
  imageUrl: z.string().trim().url().or(z.literal("")).optional(),
  ctaLabel: z.string().trim().min(1).max(80).default("Shop now"),
  ctaHref: z.string().trim().min(1).max(200).default("/shop"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});
const homepageContentSchema = z.object({
  heroEyebrow: z.string().trim().min(2).max(160).optional(),
  heroTitle: z.string().trim().min(2).max(180).optional(),
  heroSubtitle: z.string().trim().min(2).max(400).optional(),
  heroPrimaryCtaLabel: z.string().trim().min(1).max(80).optional(),
  heroPrimaryCtaHref: z.string().trim().min(1).max(200).optional(),
  heroSecondaryCtaLabel: z.string().trim().min(1).max(80).optional(),
  heroSecondaryCtaHref: z.string().trim().min(1).max(200).optional(),
  promoTitle: z.string().trim().min(2).max(160).optional(),
  promoSubtitle: z.string().trim().min(2).max(160).optional(),
  trustTitle: z.string().trim().min(2).max(160).optional(),
  trustSubtitle: z.string().trim().min(2).max(160).optional(),
  banners: z.array(homepageBannerSchema).max(6).optional(),
});
const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(120).optional(),
  logoUrl: z.string().trim().url().or(z.literal("")).optional(),
  contactEmail: z.string().trim().email().toLowerCase().optional(),
  phoneNumber: z.string().trim().min(7).max(30).optional(),
  whatsappNumber: z.string().trim().min(7).max(30).optional(),
  storeAddress: z.string().trim().min(2).max(500).optional(),
  socialLinks: z.object({
    facebook: z.string().trim().url().or(z.literal("")).optional(),
    instagram: z.string().trim().url().or(z.literal("")).optional(),
    x: z.string().trim().url().or(z.literal("")).optional(),
    tiktok: z.string().trim().url().or(z.literal("")).optional(),
  }).optional(),
  defaultCurrency: z.string().trim().length(3).toUpperCase().optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  defaultDeliveryInformation: z.string().trim().min(2).max(1000).optional(),
  returnPeriodDays: z.number().int().min(0).max(365).optional(),
  warrantyInformation: z.string().trim().min(2).max(1000).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().trim().max(500).optional(),
});
const staffUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  roles: z.array(z.enum(userRoles.filter((role) => role !== "customer"))).min(1).optional(),
  permissions: z.array(z.string().trim().min(1)).optional(),
  isActive: z.boolean().optional(),
});
const staffSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().min(7).max(30),
  password: z.string().min(8).max(128),
  roles: z.array(z.enum(userRoles.filter((role) => role !== "customer"))).min(1),
  permissions: z.array(z.string().trim().min(1)).default([]),
});
const imageSchema = z.object({
  cloudinaryPublicId: z.string().trim().min(1),
  secureUrl: z.string().trim().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  altText: z.string().trim().min(1),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});
const specificationSchema = z.object({
  groupName: z.string().trim().optional(),
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  sortOrder: z.number().int().min(0).default(0),
});
const productSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: z.string().trim().min(2).max(180),
  sku: z.string().trim().min(2).max(80),
  brandId: objectIdSchema,
  categoryId: objectIdSchema,
  conditionGradeId: objectIdSchema,
  priceKobo: z.number().int().min(0),
  previousPriceKobo: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  reservedQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(1),
  shortDescription: z.string().trim().min(2).max(260),
  description: z.string().trim().min(2),
  visibleDefects: z.string().trim().optional(),
  includedAccessories: z.string().trim().optional(),
  warrantyInformation: z.string().trim().optional(),
  colour: z.string().trim().optional(),
  modelNumber: z.string().trim().optional(),
  availability: z.enum(productAvailability).default("in_stock"),
  isFeatured: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  images: z.array(imageSchema).default([]),
  specifications: z.array(specificationSchema).default([]),
});
const productUpdateSchema = productSchema.partial();
const imageUploadSchema = z.object({
  dataUri: z.string().trim().min(20),
  altText: z.string().trim().min(2).max(160),
});
const productImageAttachSchema = imageSchema.extend({ isPrimary: z.boolean().default(false) });
const couponBaseSchema = z.object({
  code: z.string().trim().min(2).max(60).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
  type: z.enum(couponTypes),
  valueKobo: z.number().int().min(1).optional(),
  percentage: z.number().int().min(1).max(100).optional(),
  minOrderAmountKobo: z.number().int().min(0).default(0),
  maxDiscountKobo: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  usageLimitPerCustomer: z.number().int().min(1).optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  firstOrderOnly: z.boolean().default(false),
  productIds: z.array(objectIdSchema).default([]),
  categoryIds: z.array(objectIdSchema).default([]),
});
const couponSchema = couponBaseSchema
  .refine((value) => value.type !== "fixed" || value.valueKobo, {
    message: "Fixed coupons require valueKobo.",
    path: ["valueKobo"],
  })
  .refine((value) => value.type !== "percentage" || value.percentage, {
    message: "Percentage coupons require percentage.",
    path: ["percentage"],
  });
const couponUpdateSchema = couponBaseSchema.partial().refine((value) => value.expiresAt === undefined || value.startsAt === undefined || value.expiresAt > value.startsAt, {
  message: "Coupon expiration must be after the start date.",
  path: ["expiresAt"],
});
function objectIdString(value) {
  if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
  if (value && typeof value === "object" && "_id" in value) return objectIdString(value._id);
  return String(value);
}

function serializeLookup(record) {
  if (!record) return null;
  return { id: objectIdString(record._id), name: record.name, slug: record.slug, code: record.code };
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function serializeBrand(brand) {
  return {
    id: objectIdString(brand._id),
    name: brand.name,
    slug: brand.slug,
    description: brand.description ?? "",
    logoUrl: brand.logoUrl ?? "",
    isActive: brand.isActive,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}

function serializeCategory(category) {
  return {
    id: objectIdString(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? "",
    seoTitle: category.seoTitle ?? "",
    seoDescription: category.seoDescription ?? "",
    parentId: category.parentId ? objectIdString(category.parentId) : null,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function serializeConditionGrade(grade) {
  return {
    id: objectIdString(grade._id),
    code: grade.code,
    name: grade.name,
    description: grade.description,
    sortOrder: grade.sortOrder,
    isActive: grade.isActive,
    createdAt: grade.createdAt,
    updatedAt: grade.updatedAt,
  };
}

function serializeProduct(product) {
  const availableQuantity = Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
  return {
    id: objectIdString(product._id),
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brand: serializeLookup(product.brandId),
    category: serializeLookup(product.categoryId),
    conditionGrade: serializeLookup(product.conditionGradeId),
    priceKobo: product.priceKobo,
    previousPriceKobo: product.previousPriceKobo ?? null,
    stockQuantity: product.stockQuantity,
    reservedQuantity: product.reservedQuantity,
    availableQuantity,
    lowStockThreshold: product.lowStockThreshold,
    availability: product.availability,
    isFeatured: product.isFeatured,
    isArchived: product.isArchived,
    shortDescription: product.shortDescription,
    description: product.description,
    visibleDefects: product.visibleDefects ?? null,
    includedAccessories: product.includedAccessories ?? null,
    warrantyInformation: product.warrantyInformation ?? null,
    colour: product.colour ?? null,
    modelNumber: product.modelNumber ?? null,
    images: product.images ?? [],
    specifications: product.specifications ?? [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}


function serializeNewsletterSubscriber(subscriber) {
  return {
    id: objectIdString(subscriber._id),
    email: subscriber.email,
    name: subscriber.name ?? null,
    status: subscriber.status,
    source: subscriber.source,
    subscribedAt: subscriber.subscribedAt,
    unsubscribedAt: subscriber.unsubscribedAt ?? null,
    createdAt: subscriber.createdAt,
    updatedAt: subscriber.updatedAt,
  };
}

function serializeDeliveryZone(zone) {
  return {
    id: objectIdString(zone._id),
    code: zone.code,
    name: zone.name,
    state: zone.state,
    cityPattern: zone.cityPattern ?? "",
    feeKobo: zone.feeKobo,
    minDeliveryDays: zone.minDeliveryDays,
    maxDeliveryDays: zone.maxDeliveryDays,
    priority: zone.priority,
    isActive: zone.isActive,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
  };
}
function serializeOrder(order) {
  return {
    id: objectIdString(order._id),
    orderNumber: order.orderNumber,
    customer: order.customer,
    items: order.items,
    subtotalKobo: order.subtotalKobo,
    discountKobo: order.discountKobo,
    deliveryFeeKobo: order.deliveryFeeKobo,
    totalKobo: order.totalKobo,
    currency: order.currency,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function assertLookupsExist(input) {
  const [brand, category, grade] = await Promise.all([
    input.brandId ? Brand.exists({ _id: input.brandId }) : true,
    input.categoryId ? Category.exists({ _id: input.categoryId }) : true,
    input.conditionGradeId ? ConditionGrade.exists({ _id: input.conditionGradeId }) : true,
  ]);
  if (!brand) throw new AppError(400, "BRAND_NOT_FOUND", "Selected brand was not found.");
  if (!category) throw new AppError(400, "CATEGORY_NOT_FOUND", "Selected category was not found.");
  if (!grade) throw new AppError(400, "CONDITION_GRADE_NOT_FOUND", "Selected condition grade was not found.");
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getReportDateRange(query) {
  const now = new Date();
  const preset = String(query.range ?? "month");
  if (preset === "today") return { start: startOfDay(now), end: addDays(startOfDay(now), 1), label: "Today" };
  if (preset === "week") return { start: addDays(startOfDay(now), -6), end: addDays(startOfDay(now), 1), label: "This week" };
  if (preset === "custom") {
    const start = query.dateFrom ? startOfDay(new Date(String(query.dateFrom))) : addDays(startOfDay(now), -30);
    const end = query.dateTo ? addDays(startOfDay(new Date(String(query.dateTo))), 1) : addDays(startOfDay(now), 1);
    return { start, end, label: "Custom" };
  }
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: addDays(startOfDay(now), 1), label: "This month" };
}

async function buildReportFilters(query) {
  const { start, end, label } = getReportDateRange(query);
  const orderFilter = { createdAt: { $gte: start, $lt: end } };
  const paymentFilter = { createdAt: { $gte: start, $lt: end } };
  if (query.orderStatus) orderFilter.orderStatus = String(query.orderStatus);
  if (query.paymentStatus) {
    orderFilter.paymentStatus = String(query.paymentStatus);
    paymentFilter.status = String(query.paymentStatus);
  }
  if (query.productId && mongoose.Types.ObjectId.isValid(String(query.productId))) orderFilter["items.productId"] = new mongoose.Types.ObjectId(String(query.productId));
  if (query.categoryId && mongoose.Types.ObjectId.isValid(String(query.categoryId))) {
    const categoryProductIds = await Product.find({ categoryId: query.categoryId }).distinct("_id");
    orderFilter["items.productId"] = { $in: categoryProductIds };
  }
  return { orderFilter, paymentFilter, range: { start, end, label } };
}

function csvEscape(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function ordersToCsv(orders) {
  const rows = [["Order Number", "Customer", "Email", "Status", "Payment", "Subtotal", "Discount", "Delivery", "Total", "Created At"]];
  for (const order of orders) {
    rows.push([
      order.orderNumber,
      order.customer?.name,
      order.customer?.email,
      order.orderStatus,
      order.paymentStatus,
      order.subtotalKobo,
      order.discountKobo,
      order.deliveryFeeKobo,
      order.totalKobo,
      order.createdAt?.toISOString?.() ?? order.createdAt,
    ]);
  }
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function paymentsToCsv(payments) {
  const rows = [["Reference", "Order Number", "Customer Email", "Status", "Amount", "Currency", "Channel", "Gateway Response", "Paid At", "Verified At", "Created At"]];
  for (const payment of payments) {
    rows.push([
      payment.reference,
      payment.orderNumber,
      payment.customerEmail,
      payment.status,
      payment.amountKobo,
      payment.currency,
      payment.channel,
      payment.gatewayResponse,
      payment.paidAt?.toISOString?.() ?? payment.paidAt,
      payment.verifiedAt?.toISOString?.() ?? payment.verifiedAt,
      payment.createdAt?.toISOString?.() ?? payment.createdAt,
    ]);
  }
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}function availabilityForStock(stockQuantity, reservedQuantity, lowStockThreshold) {
  const available = Math.max(0, Number(stockQuantity) - Number(reservedQuantity ?? 0));
  if (available <= 0) return "out_of_stock";
  if (available <= Number(lowStockThreshold ?? 1)) return "low_stock";
  return "in_stock";
}

/**
 * @openapi
 * /api/v1/admin/catalogue-lookups:
 *   get:
 *     tags: [Admin]
 *     summary: List categories, brands and condition grades for catalogue setup
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Catalogue lookups returned
 */
adminRouter.get("/catalogue-lookups", requirePermissions("products:read", "products:manage"), async (_request, response, next) => {
  try {
    const [categories, brands, conditionGrades] = await Promise.all([
      Category.find({}).sort({ name: 1 }).lean(),
      Brand.find({}).sort({ name: 1 }).lean(),
      ConditionGrade.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
    ]);
    response.json({ data: { categories: categories.map(serializeCategory), brands: brands.map(serializeBrand), conditionGrades: conditionGrades.map(serializeConditionGrade) } });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/brands", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const input = brandSchema.parse(request.body);
    const brand = await Brand.create({ ...input, slug: input.slug || slugify(input.name) });
    await logAdminActivity(request, { action: "brand.created", resourceType: "brand", resourceId: brand._id, details: { name: brand.name, slug: brand.slug } });
    response.status(201).json({ data: { brand: serializeBrand(brand) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "BRAND_ALREADY_EXISTS", "A brand with that name or slug already exists."));
    else next(error);
  }
});

adminRouter.patch("/brands/:id", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = brandUpdateSchema.parse(request.body);
    const brand = await Brand.findByIdAndUpdate(id, { ...input, ...(input.name && !input.slug ? { slug: slugify(input.name) } : {}) }, { returnDocument: "after", runValidators: true });
    if (!brand) throw new AppError(404, "BRAND_NOT_FOUND", "Brand was not found.");
    await logAdminActivity(request, { action: "brand.updated", resourceType: "brand", resourceId: brand._id, details: { name: brand.name, slug: brand.slug, isActive: brand.isActive } });
    response.json({ data: { brand: serializeBrand(brand) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "BRAND_ALREADY_EXISTS", "A brand with that name or slug already exists."));
    else next(error);
  }
});

adminRouter.post("/categories", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const input = categorySchema.parse(request.body);
    const category = await Category.create({ ...input, slug: input.slug || slugify(input.name) });
    await logAdminActivity(request, { action: "category.created", resourceType: "category", resourceId: category._id, details: { name: category.name, slug: category.slug } });
    response.status(201).json({ data: { category: serializeCategory(category) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "CATEGORY_ALREADY_EXISTS", "A category with that slug already exists."));
    else next(error);
  }
});

adminRouter.patch("/categories/:id", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = categoryUpdateSchema.parse(request.body);
    const category = await Category.findByIdAndUpdate(id, { ...input, ...(input.name && !input.slug ? { slug: slugify(input.name) } : {}) }, { returnDocument: "after", runValidators: true });
    if (!category) throw new AppError(404, "CATEGORY_NOT_FOUND", "Category was not found.");
    await logAdminActivity(request, { action: "category.updated", resourceType: "category", resourceId: category._id, details: { name: category.name, slug: category.slug, isActive: category.isActive } });
    response.json({ data: { category: serializeCategory(category) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "CATEGORY_ALREADY_EXISTS", "A category with that slug already exists."));
    else next(error);
  }
});

adminRouter.post("/condition-grades", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const input = conditionGradeSchema.parse(request.body);
    const grade = await ConditionGrade.create(input);
    await logAdminActivity(request, { action: "condition_grade.created", resourceType: "condition_grade", resourceId: grade._id, details: { code: grade.code, name: grade.name } });
    response.status(201).json({ data: { conditionGrade: serializeConditionGrade(grade) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "CONDITION_GRADE_ALREADY_EXISTS", "A condition grade with that code already exists."));
    else next(error);
  }
});

adminRouter.patch("/condition-grades/:id", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = conditionGradeUpdateSchema.parse(request.body);
    const grade = await ConditionGrade.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true });
    if (!grade) throw new AppError(404, "CONDITION_GRADE_NOT_FOUND", "Condition grade was not found.");
    await logAdminActivity(request, { action: "condition_grade.updated", resourceType: "condition_grade", resourceId: grade._id, details: { code: grade.code, name: grade.name, isActive: grade.isActive } });
    response.json({ data: { conditionGrade: serializeConditionGrade(grade) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "CONDITION_GRADE_ALREADY_EXISTS", "A condition grade with that code already exists."));
    else next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/delivery-zones:
 *   get:
 *     tags: [Admin]
 *     summary: List delivery zones and pickup coverage
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Delivery zones returned
 */
adminRouter.get("/delivery-zones", requirePermissions("orders:update", "dashboard:view"), async (_request, response, next) => {
  try {
    const zones = await DeliveryZone.find({}).sort({ state: 1, priority: -1, name: 1 }).lean();
    response.json({ data: { items: zones.map(serializeDeliveryZone) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/delivery-zones:
 *   post:
 *     tags: [Admin]
 *     summary: Create a delivery zone
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Delivery zone created
 */
adminRouter.post("/delivery-zones", requireRoles("admin", "super_admin", "order_manager"), async (request, response, next) => {
  try {
    const input = deliveryZoneSchema.parse(request.body);
    const zone = await DeliveryZone.create(input);
    await logAdminActivity(request, { action: "delivery_zone.created", resourceType: "delivery_zone", resourceId: zone._id, details: { code: zone.code, state: zone.state, feeKobo: zone.feeKobo } });
    response.status(201).json({ data: { zone: serializeDeliveryZone(zone) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "DELIVERY_ZONE_ALREADY_EXISTS", "A delivery zone with that code already exists."));
    else next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/delivery-zones/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a delivery zone fee, location, timing or active status
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Delivery zone updated
 */
adminRouter.patch("/delivery-zones/:id", requireRoles("admin", "super_admin", "order_manager"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = deliveryZoneUpdateSchema.parse(request.body);
    const zone = await DeliveryZone.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true });
    if (!zone) throw new AppError(404, "DELIVERY_ZONE_NOT_FOUND", "Delivery zone was not found.");
    await logAdminActivity(request, { action: "delivery_zone.updated", resourceType: "delivery_zone", resourceId: zone._id, details: { code: zone.code, state: zone.state, feeKobo: zone.feeKobo, isActive: zone.isActive } });
    response.json({ data: { zone: serializeDeliveryZone(zone) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "DELIVERY_ZONE_ALREADY_EXISTS", "A delivery zone with that code already exists."));
    else next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/newsletter-subscribers:
 *   get:
 *     tags: [Admin]
 *     summary: List newsletter subscribers for administrators
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Newsletter subscribers returned
 */
adminRouter.get("/newsletter-subscribers", requireRoles("admin", "super_admin", "content_manager"), async (request, response, next) => {
  try {
    const status = request.query.status ? String(request.query.status) : "";
    const filter = newsletterSubscriberStatuses.includes(status) ? { status } : {};
    const [subscribers, total, subscribed, unsubscribed] = await Promise.all([
      NewsletterSubscriber.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
      NewsletterSubscriber.countDocuments({}),
      NewsletterSubscriber.countDocuments({ status: "subscribed" }),
      NewsletterSubscriber.countDocuments({ status: "unsubscribed" }),
    ]);
    response.json({ data: { items: subscribers.map(serializeNewsletterSubscriber), summary: { total, subscribed, unsubscribed } } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/newsletter-subscribers/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a newsletter subscriber status
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Newsletter subscriber updated
 */
adminRouter.patch("/newsletter-subscribers/:id", requireRoles("admin", "super_admin", "content_manager"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = newsletterStatusSchema.parse(request.body);
    const update = {
      status: input.status,
      unsubscribedAt: input.status === "unsubscribed" ? new Date() : null,
      ...(input.status === "subscribed" ? { subscribedAt: new Date() } : {}),
    };
    const subscriber = await NewsletterSubscriber.findByIdAndUpdate(id, update, { returnDocument: "after", runValidators: true });
    if (!subscriber) throw new AppError(404, "NEWSLETTER_SUBSCRIBER_NOT_FOUND", "Newsletter subscriber was not found.");
    await logAdminActivity(request, { action: "newsletter_subscriber.updated", resourceType: "newsletter_subscriber", resourceId: subscriber._id, details: { email: subscriber.email, status: subscriber.status } });
    response.json({ data: { subscriber: serializeNewsletterSubscriber(subscriber) } });
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/homepage-content:
 *   get:
 *     tags: [Admin]
 *     summary: Get editable homepage content
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Homepage content returned
 */
adminRouter.get("/homepage-content", requirePermissions("products:manage", "coupons:manage"), async (_request, response, next) => {
  try {
    const content = await getHomepageContent();
    response.json({ data: { content: serializeHomepageContent(content) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/homepage-content:
 *   patch:
 *     tags: [Admin]
 *     summary: Update homepage content and banners
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Homepage content updated
 */
adminRouter.patch("/homepage-content", requirePermissions("products:manage", "coupons:manage"), async (request, response, next) => {
  try {
    const input = homepageContentSchema.parse(request.body);
    const content = await getHomepageContent();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) content[key] = value;
    }
    await content.save();
    await logAdminActivity(request, { action: "homepage_content.updated", resourceType: "homepage_content", resourceId: content._id, details: { fields: Object.keys(input), bannerCount: content.banners.length } });
    response.json({ data: { content: serializeHomepageContent(content) } });
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/activity-logs:
 *   get:
 *     tags: [Admin]
 *     summary: List administrator activity logs; super administrator only
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Activity logs returned
 */
adminRouter.get("/activity-logs", requireRoles("super_admin"), async (_request, response, next) => {
  try {
    const logs = await AdminActivityLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
    response.json({ data: { items: logs.map(serializeAdminActivityLog) } });
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/store-settings:
 *   get:
 *     tags: [Admin]
 *     summary: Get full store settings; super administrator only
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Store settings returned
 */
adminRouter.get("/store-settings", requireRoles("super_admin"), async (_request, response, next) => {
  try {
    const settings = await getStoreSettings();
    response.json({ data: { settings: serializeStoreSettings(settings) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/store-settings:
 *   patch:
 *     tags: [Admin]
 *     summary: Update store settings; super administrator only
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Store settings updated
 */
adminRouter.patch("/store-settings", requireRoles("super_admin"), async (request, response, next) => {
  try {
    const input = storeSettingsSchema.parse(request.body);
    const settings = await getStoreSettings();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) settings[key] = value;
    }
    await settings.save();
    await logAdminActivity(request, { action: "store_settings.updated", resourceType: "store_settings", resourceId: settings._id, details: { fields: Object.keys(input), maintenanceMode: settings.maintenanceMode } });
    response.json({ data: { settings: serializeStoreSettings(settings) } });
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get protected admin dashboard statistics
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics returned
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 */
adminRouter.get("/dashboard", requirePermissions("dashboard:view"), async (_request, response, next) => {
  try {
    const [totalProducts, lowStockProducts, outOfStockProducts, totalOrders, paidOrders, pendingOrders, totalCustomers, successfulPayments] = await Promise.all([
      Product.countDocuments({ isArchived: false }),
      Product.countDocuments({ isArchived: false, availability: "low_stock" }),
      Product.countDocuments({ isArchived: false, availability: "out_of_stock" }),
      Order.countDocuments({}),
      Order.countDocuments({ paymentStatus: "successful" }),
      Order.countDocuments({ paymentStatus: "pending" }),
      User.countDocuments({ roles: "customer" }),
      Payment.find({ status: "successful" }).select("amountKobo").lean(),
    ]);
    response.json({ data: { stats: { totalRevenueKobo: successfulPayments.reduce((total, payment) => total + Number(payment.amountKobo ?? 0), 0), totalProducts, lowStockProducts, outOfStockProducts, totalOrders, paidOrders, pendingOrders, totalCustomers } } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: Get sales, order, inventory and payment reports
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Report data returned
 */
adminRouter.get("/reports", requirePermissions("reports:view"), async (request, response, next) => {
  try {
    const { orderFilter, paymentFilter, range } = await buildReportFilters(request.query);
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [orders, payments, currentMonthPayments, refundedReturns, productCounts, recentOrders, recentPayments, bestSellingProducts] = await Promise.all([
      Order.find(orderFilter).sort({ createdAt: -1 }).lean(),
      Payment.find(paymentFilter).sort({ createdAt: -1 }).lean(),
      Payment.find({ status: "successful", createdAt: { $gte: currentMonthStart } }).select("amountKobo").lean(),
      ReturnRequest.find({ status: "refunded", refundProcessedAt: { $gte: range.start, $lt: range.end } }).select("refundAmountKobo refundReference refundProcessedAt orderNumber customer").sort({ refundProcessedAt: -1 }).limit(25).lean(),
      Product.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: "$availability", count: { $sum: 1 } } },
      ]),
      Order.find(orderFilter).sort({ createdAt: -1 }).limit(8).lean(),
      Payment.find(paymentFilter).sort({ createdAt: -1 }).limit(8).lean(),
      Order.aggregate([
        { $match: orderFilter },
        { $unwind: "$items" },
        { $group: { _id: "$items.sku", name: { $first: "$items.name" }, quantitySold: { $sum: "$items.quantity" }, revenueKobo: { $sum: "$items.lineSubtotalKobo" } } },
        { $sort: { quantitySold: -1, revenueKobo: -1 } },
        { $limit: 8 },
      ]),
    ]);
    const successfulPayments = payments.filter((payment) => payment.status === "successful");
    const totalRefundedKobo = refundedReturns.reduce((total, item) => total + Number(item.refundAmountKobo ?? 0), 0);
    const ordersByStatus = Object.fromEntries(orderStatuses.map((status) => [status, orders.filter((order) => order.orderStatus === status).length]));
    const paymentsByStatus = Object.fromEntries(["pending", "successful", "failed", "abandoned", "refunded", "partially_refunded"].map((status) => [status, payments.filter((payment) => payment.status === status).length]));
    const revenueByDate = successfulPayments.reduce((accumulator, payment) => {
      const dateKey = payment.createdAt.toISOString().slice(0, 10);
      accumulator[dateKey] = (accumulator[dateKey] ?? 0) + Number(payment.amountKobo ?? 0);
      return accumulator;
    }, {});
    const inventory = productCounts.reduce((accumulator, item) => ({ ...accumulator, [item._id]: item.count }), {});
    response.json({
      data: {
        range,
        summary: {
          totalRevenueKobo: successfulPayments.reduce((total, payment) => total + Number(payment.amountKobo ?? 0), 0),
          currentMonthRevenueKobo: currentMonthPayments.reduce((total, payment) => total + Number(payment.amountKobo ?? 0), 0),
          totalOrders: orders.length,
          paidOrders: orders.filter((order) => order.paymentStatus === "successful").length,
          pendingOrders: orders.filter((order) => order.paymentStatus === "pending").length,
          cancelledOrders: orders.filter((order) => order.orderStatus === "cancelled").length,
          totalRefundedKobo,
          productsInStock: inventory.in_stock ?? 0,
          lowStockProducts: inventory.low_stock ?? 0,
          outOfStockProducts: inventory.out_of_stock ?? 0,
        },
        ordersByStatus,
        paymentsByStatus,
        revenueByDate: Object.entries(revenueByDate).map(([date, revenueKobo]) => ({ date, revenueKobo })),
        recentOrders: recentOrders.map(serializeOrder),
        recentPayments: recentPayments.map((payment) => ({ id: objectIdString(payment._id), orderNumber: payment.orderNumber, reference: payment.reference, amountKobo: payment.amountKobo, status: payment.status, customerEmail: payment.customerEmail, createdAt: payment.createdAt })),
        recentRefunds: refundedReturns.map((refund) => ({ id: objectIdString(refund._id), orderNumber: refund.orderNumber, customerEmail: refund.customer?.email, refundAmountKobo: refund.refundAmountKobo, refundReference: refund.refundReference, refundProcessedAt: refund.refundProcessedAt })),
        bestSellingProducts: bestSellingProducts.map((item) => ({ sku: item._id, name: item.name, quantitySold: item.quantitySold, revenueKobo: item.revenueKobo })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/reports/orders.csv:
 *   get:
 *     tags: [Admin]
 *     summary: Export filtered orders as CSV
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: CSV export returned
 */
adminRouter.get("/reports/orders.csv", requirePermissions("reports:view"), async (request, response, next) => {
  try {
    const { orderFilter } = await buildReportFilters(request.query);
    const orders = await Order.find(orderFilter).sort({ createdAt: -1 }).lean();
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", 'attachment; filename="just-adure-orders-report.csv"');
    response.send(ordersToCsv(orders));
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/reports/payments.csv:
 *   get:
 *     tags: [Admin]
 *     summary: Export filtered payments as CSV
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: CSV export returned
 */
adminRouter.get("/reports/payments.csv", requirePermissions("reports:view"), async (request, response, next) => {
  try {
    const { paymentFilter } = await buildReportFilters(request.query);
    const payments = await Payment.find(paymentFilter).sort({ createdAt: -1 }).lean();
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", 'attachment; filename="just-adure-payments-report.csv"');
    response.send(paymentsToCsv(payments));
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/products:
 *   get:
 *     tags: [Admin]
 *     summary: List products for administrators, including archived products
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Admin product list returned
 */
adminRouter.get("/products", requirePermissions("products:read", "products:manage", "inventory:manage"), async (_request, response, next) => {
  try {
    const products = await Product.find({}).populate("brandId").populate("categoryId").populate("conditionGradeId").sort({ createdAt: -1 }).limit(100).lean();
    response.json({ data: { items: products.map(serializeProduct) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/products:
 *   post:
 *     tags: [Admin]
 *     summary: Create a product
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Product created
 *       409:
 *         description: Product slug or SKU already exists
 */
adminRouter.post("/products", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const input = productSchema.parse(request.body);
    await assertLookupsExist(input);
    const product = await Product.create({ ...input, availability: input.isArchived ? "archived" : availabilityForStock(input.stockQuantity, input.reservedQuantity, input.lowStockThreshold) });
    await logAdminActivity(request, { action: "product.created", resourceType: "product", resourceId: product._id, details: { name: product.name, sku: product.sku, priceKobo: product.priceKobo, stockQuantity: product.stockQuantity } });
    const populated = await Product.findById(product._id).populate("brandId").populate("categoryId").populate("conditionGradeId").lean();
    response.status(201).json({ data: { product: serializeProduct(populated) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "PRODUCT_ALREADY_EXISTS", "A product with that slug or SKU already exists."));
    else next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/products/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update product details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
adminRouter.patch("/products/:id", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = productUpdateSchema.parse(request.body);
    await assertLookupsExist(input);
    if (input.stockQuantity !== undefined || input.reservedQuantity !== undefined || input.lowStockThreshold !== undefined) {
      const current = await Product.findById(id).lean();
      if (!current) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
      input.availability = input.isArchived ? "archived" : availabilityForStock(input.stockQuantity ?? current.stockQuantity, input.reservedQuantity ?? current.reservedQuantity, input.lowStockThreshold ?? current.lowStockThreshold);
    }
    const product = await Product.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true }).populate("brandId").populate("categoryId").populate("conditionGradeId").lean();
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    await logAdminActivity(request, { action: "product.updated", resourceType: "product", resourceId: product._id, details: { fields: Object.keys(input), name: product.name, sku: product.sku } });
    response.json({ data: { product: serializeProduct(product) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "PRODUCT_ALREADY_EXISTS", "A product with that slug or SKU already exists."));
    else next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/uploads/product-image:
 *   post:
 *     tags: [Admin]
 *     summary: Upload a product image to Cloudinary
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Product image uploaded
 */
adminRouter.post("/uploads/product-image", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const input = imageUploadSchema.parse(request.body);
    const image = await uploadProductImage(input);
    await logAdminActivity(request, { action: "product_image.uploaded", resourceType: "product_image", resourceId: image.cloudinaryPublicId, details: { secureUrl: image.secureUrl, altText: image.altText } });
    response.status(201).json({ data: { image } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/products/{id}/images:
 *   post:
 *     tags: [Admin]
 *     summary: Attach an uploaded image to a product
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Product image attached
 */
adminRouter.post("/products/:id/images", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = productImageAttachSchema.parse(request.body);
    const product = await Product.findById(id);
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    if (input.isPrimary) product.images.forEach((image) => { image.isPrimary = false; });
    product.images.push({ ...input, sortOrder: input.sortOrder ?? product.images.length, isPrimary: input.isPrimary || product.images.length === 0 });
    await product.save();
    await logAdminActivity(request, { action: "product_image.attached", resourceType: "product", resourceId: product._id, details: { sku: product.sku, cloudinaryPublicId: input.cloudinaryPublicId } });
    const populated = await Product.findById(product._id).populate("brandId").populate("categoryId").populate("conditionGradeId").lean();
    response.json({ data: { product: serializeProduct(populated) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/products/{id}/images/{publicId}/primary:
 *   patch:
 *     tags: [Admin]
 *     summary: Mark a product image as the main product image
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Primary product image updated
 */
adminRouter.patch("/products/:id/images/:publicId/primary", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const { id, publicId } = z.object({ id: objectIdSchema, publicId: z.string().trim().min(1) }).parse(request.params);
    const decodedPublicId = decodeURIComponent(publicId);
    const product = await Product.findById(id);
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    const target = product.images.find((image) => image.cloudinaryPublicId === decodedPublicId);
    if (!target) throw new AppError(404, "PRODUCT_IMAGE_NOT_FOUND", "Product image was not found.");
    product.images.forEach((image) => { image.isPrimary = image.cloudinaryPublicId === decodedPublicId; });
    await product.save();
    await logAdminActivity(request, { action: "product_image.primary_updated", resourceType: "product", resourceId: product._id, details: { sku: product.sku, cloudinaryPublicId: decodedPublicId } });
    const populated = await Product.findById(product._id).populate("brandId").populate("categoryId").populate("conditionGradeId").lean();
    response.json({ data: { product: serializeProduct(populated) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/products/{id}/images/{publicId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Remove an image from a product catalogue record
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Product image removed
 */
adminRouter.delete("/products/:id/images/:publicId", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const { id, publicId } = z.object({ id: objectIdSchema, publicId: z.string().trim().min(1) }).parse(request.params);
    const decodedPublicId = decodeURIComponent(publicId);
    const product = await Product.findById(id);
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    const beforeCount = product.images.length;
    product.images = product.images.filter((image) => image.cloudinaryPublicId !== decodedPublicId);
    if (product.images.length === beforeCount) throw new AppError(404, "PRODUCT_IMAGE_NOT_FOUND", "Product image was not found.");
    if (product.images.length > 0 && !product.images.some((image) => image.isPrimary)) product.images[0].isPrimary = true;
    await product.save();
    await logAdminActivity(request, { action: "product_image.removed", resourceType: "product", resourceId: product._id, details: { sku: product.sku, cloudinaryPublicId: decodedPublicId } });
    const populated = await Product.findById(product._id).populate("brandId").populate("categoryId").populate("conditionGradeId").lean();
    response.json({ data: { product: serializeProduct(populated) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/products/{id}/stock:
 *   patch:
 *     tags: [Admin]
 *     summary: Update product stock quantity and availability
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product stock updated
 */
adminRouter.patch("/products/:id/stock", requirePermissions("inventory:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = stockUpdateSchema.parse(request.body);
    const product = await Product.findById(id);
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    const previousAvailableQuantity = Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
    product.stockQuantity = input.stockQuantity;
    if (input.lowStockThreshold !== undefined) product.lowStockThreshold = input.lowStockThreshold;
    product.availability = product.isArchived ? "archived" : availabilityForStock(product.stockQuantity, product.reservedQuantity, product.lowStockThreshold);
    await product.save();
    const nextAvailableQuantity = Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
    if (previousAvailableQuantity <= 0 && nextAvailableQuantity > 0) await processBackInStockAlerts(product);
    await logAdminActivity(request, { action: "inventory.updated", resourceType: "product", resourceId: product._id, details: { name: product.name, sku: product.sku, stockQuantity: product.stockQuantity, availability: product.availability } });
    const populated = await Product.findById(product._id).populate("brandId").populate("categoryId").populate("conditionGradeId").lean();
    response.json({ data: { product: serializeProduct(populated) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/products/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Archive a product
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product archived
 */
adminRouter.delete("/products/:id", requirePermissions("products:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const product = await Product.findByIdAndUpdate(id, { isArchived: true, availability: "archived" }, { returnDocument: "after" }).lean();
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    await logAdminActivity(request, { action: "product.archived", resourceType: "product", resourceId: product._id, details: { name: product.name, sku: product.sku } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});


/**
 * @openapi
 * /api/v1/admin/coupons:
 *   get:
 *     tags: [Admin]
 *     summary: List coupons for administrators
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Coupon list returned
 */
adminRouter.get("/coupons", requirePermissions("coupons:manage"), async (_request, response, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).limit(100).lean();
    response.json({ data: { items: coupons.map(serializeCoupon) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/coupons:
 *   post:
 *     tags: [Admin]
 *     summary: Create a coupon
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Coupon created
 */
adminRouter.post("/coupons", requirePermissions("coupons:manage"), async (request, response, next) => {
  try {
    const input = couponSchema.parse(request.body);
    const coupon = await Coupon.create(input);
    await logAdminActivity(request, { action: "coupon.created", resourceType: "coupon", resourceId: coupon._id, details: { code: coupon.code, type: coupon.type } });
    response.status(201).json({ data: { coupon: serializeCoupon(coupon) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "COUPON_ALREADY_EXISTS", "A coupon with that code already exists."));
    else next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/coupons/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a coupon
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Coupon updated
 */
adminRouter.patch("/coupons/:id", requirePermissions("coupons:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = couponUpdateSchema.parse(request.body);
    const coupon = await Coupon.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true });
    if (!coupon) throw new AppError(404, "COUPON_NOT_FOUND", "Coupon was not found.");
    await logAdminActivity(request, { action: "coupon.updated", resourceType: "coupon", resourceId: coupon._id, details: { code: coupon.code, fields: Object.keys(input) } });
    response.json({ data: { coupon: serializeCoupon(coupon) } });
  } catch (error) {
    if (error?.code === 11000) next(new AppError(409, "COUPON_ALREADY_EXISTS", "A coupon with that code already exists."));
    else next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: List orders for administrators
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Admin order list returned
 */
adminRouter.get("/orders", requirePermissions("orders:read", "orders:update"), async (_request, response, next) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(100).lean();
    response.json({ data: { items: orders.map(serializeOrder) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/orders/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update an order status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status updated
 */
adminRouter.patch("/orders/:id/status", requirePermissions("orders:update"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = orderStatusSchema.parse(request.body);
    const order = await Order.findById(id);
    if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order was not found.");
    order.orderStatus = input.status;
    order.statusHistory.push({ status: input.status, note: input.note ?? "Updated by administrator." });
    await order.save();
    await logAdminActivity(request, { action: "order.status_updated", resourceType: "order", resourceId: order._id, details: { orderNumber: order.orderNumber, status: input.status } });
    response.json({ data: { order: serializeOrder(order.toObject()) } });
  } catch (error) {
    next(error);
  }
});



/**
 * @openapi
 * /api/v1/admin/support-tickets:
 *   get:
 *     tags: [Admin]
 *     summary: List customer support tickets
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Support tickets returned
 */
adminRouter.get("/support-tickets", requirePermissions("support:manage"), async (_request, response, next) => {
  try {
    const tickets = await SupportTicket.find({}).sort({ createdAt: -1 }).limit(100).lean();
    response.json({ data: { items: tickets.map(serializeSupportTicket) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/support-tickets/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a support ticket status, reply or internal note
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Support ticket updated
 */
adminRouter.patch("/support-tickets/:id", requirePermissions("support:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = supportTicketUpdateSchema.parse(request.body);
    const ticket = await SupportTicket.findById(id);
    if (!ticket) throw new AppError(404, "SUPPORT_TICKET_NOT_FOUND", "Support ticket was not found.");

    ticket.status = input.status;
    if (input.internalNote !== undefined) ticket.internalNote = input.internalNote;
    if (input.reply) ticket.replies.push({ authorType: "admin", authorName: "Store support", message: input.reply });
    if (["resolved", "closed"].includes(input.status)) ticket.resolvedAt = new Date();
    await ticket.save();
    await logAdminActivity(request, { action: "support_ticket.updated", resourceType: "support_ticket", resourceId: ticket._id, details: { ticketNumber: ticket.ticketNumber, status: ticket.status, replied: Boolean(input.reply) } });

    response.json({ data: { ticket: serializeSupportTicket(ticket) } });
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/returns:
 *   get:
 *     tags: [Admin]
 *     summary: List return and refund requests
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Return request list returned
 */
adminRouter.get("/returns", requirePermissions("returns:manage"), async (_request, response, next) => {
  try {
    const returns = await ReturnRequest.find({}).sort({ createdAt: -1 }).limit(100).lean();
    response.json({ data: { items: returns.map(serializeReturnRequest) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/returns/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a return or refund request
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Return request updated
 */
adminRouter.patch("/returns/:id", requirePermissions("returns:manage"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = returnModerationSchema.parse(request.body);
    const returnRequest = await ReturnRequest.findById(id);
    if (!returnRequest) throw new AppError(404, "RETURN_REQUEST_NOT_FOUND", "Return request was not found.");

    const order = await Order.findById(returnRequest.orderId);
    if (input.status === "refunded") {
      if (returnRequest.status === "refunded" || returnRequest.refundProcessedAt) {
        throw new AppError(409, "RETURN_ALREADY_REFUNDED", "This return request has already been marked as refunded.");
      }
      if (!order || !["successful", "partially_refunded"].includes(order.paymentStatus)) {
        throw new AppError(409, "ORDER_NOT_REFUNDABLE", "Only successful paid orders can be marked as refunded.");
      }
      if (!input.refundAmountKobo || input.refundAmountKobo > order.totalKobo) {
        throw new AppError(400, "INVALID_REFUND_AMOUNT", "Enter a valid refund amount that does not exceed the order total.");
      }
      if (!input.refundReference && !input.adminNote) {
        throw new AppError(400, "REFUND_REFERENCE_REQUIRED", "Enter a refund reference or admin note before marking this return as refunded.");
      }
    }

    returnRequest.status = input.status;
    if (input.adminNote !== undefined) returnRequest.adminNote = input.adminNote;
    if (["rejected", "refunded", "closed"].includes(input.status)) {
      returnRequest.resolvedAt = new Date();
      returnRequest.resolvedBy = request.user.id;
    }
    if (input.status === "refunded") {
      returnRequest.refundAmountKobo = input.refundAmountKobo;
      returnRequest.refundReference = input.refundReference || input.adminNote;
      returnRequest.refundProcessedAt = new Date();
    }
    await returnRequest.save();

    const nextOrderStatus = input.status === "refunded" ? "refunded" : input.status === "approved" ? "returned" : input.status === "rejected" ? "delivered" : "return_requested";
    if (order) {
      order.orderStatus = nextOrderStatus;
      if (input.status === "refunded") {
        order.paymentStatus = input.refundAmountKobo >= order.totalKobo ? "refunded" : "partially_refunded";
        const payment = await Payment.findOne({ orderId: order._id, status: { $in: ["successful", "partially_refunded"] } }).sort({ createdAt: -1 });
        if (payment) {
          payment.status = order.paymentStatus;
          payment.gatewayResponse = `Refund recorded manually: ${returnRequest.refundReference}`;
          await payment.save();
        }
      }
      order.statusHistory.push({ status: nextOrderStatus, note: input.adminNote ?? `Return request ${returnRequest.requestNumber} moved to ${input.status}.` });
      await order.save();
    }

    await notifyCustomer(order?.userId, { type: "return", title: "Return request updated", message: `Your return request ${returnRequest.requestNumber} is now ${input.status}.`, resourceType: "return", resourceId: String(returnRequest._id), actionUrl: `/order-tracking?orderNumber=${encodeURIComponent(returnRequest.orderNumber)}` });

    await logAdminActivity(request, { action: input.status === "refunded" ? "refund.recorded" : "return.updated", resourceType: "return", resourceId: returnRequest._id, details: { requestNumber: returnRequest.requestNumber, status: input.status, orderNumber: returnRequest.orderNumber, refundAmountKobo: returnRequest.refundAmountKobo, refundReference: returnRequest.refundReference } });
    response.json({ data: { returnRequest: serializeReturnRequest(returnRequest) } });
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/reviews:
 *   get:
 *     tags: [Admin]
 *     summary: List product reviews for moderation
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Review list returned
 */
adminRouter.get("/reviews", requirePermissions("reviews:moderate"), async (_request, response, next) => {
  try {
    const reviews = await Review.find({}).populate("productId").sort({ createdAt: -1 }).limit(100).lean();
    response.json({ data: { items: reviews.map(serializeReview) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/admin/reviews/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Moderate a product review
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Review moderated
 */
adminRouter.patch("/reviews/:id", requirePermissions("reviews:moderate"), async (request, response, next) => {
  try {
    const { id } = z.object({ id: objectIdSchema }).parse(request.params);
    const input = reviewModerationSchema.parse(request.body);
    const review = await Review.findByIdAndUpdate(
      id,
      { ...input, moderatedAt: new Date(), moderatedBy: request.user.id },
      { returnDocument: "after", runValidators: true },
    ).populate("productId");
    if (!review) throw new AppError(404, "REVIEW_NOT_FOUND", "Review was not found.");
    await notifyCustomer(review.userId, { type: "review", title: "Review moderated", message: `Your review for ${review.productId?.name ?? "a product"} is now ${input.status}.`, resourceType: "review", resourceId: String(review._id), actionUrl: "/account" });

    await logAdminActivity(request, { action: "review.moderated", resourceType: "review", resourceId: review._id, details: { status: input.status, productName: review.productId?.name } });
    response.json({ data: { review: serializeReview(review) } });
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/staff:
 *   get:
 *     tags: [Admin]
 *     summary: List staff accounts; super administrator only
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Staff list returned
 *       403:
 *         description: Super administrator role required
 */
adminRouter.get("/staff", requireRoles("super_admin"), async (_request, response, next) => {
  try {
    const staff = await User.find({ roles: { $ne: "customer" } }).sort({ createdAt: -1 }).lean();
    response.json({
      data: {
        items: staff.map((user) => ({
          id: objectIdString(user._id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          roles: user.roles,
          permissions: user.permissions,
          isActive: user.isActive,
          createdAt: user.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});


/**
 * @openapi
 * /api/v1/admin/staff:
 *   post:
 *     tags: [Admin]
 *     summary: Create a staff account; super administrator only
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Staff account created
 *       403:
 *         description: Super administrator role required
 */
adminRouter.post("/staff", requireRoles("super_admin"), async (request, response, next) => {
  try {
    const input = staffSchema.parse(request.body);
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) throw new AppError(409, "EMAIL_ALREADY_REGISTERED", "A user already exists with this email address.");

    const { hashPassword } = await import("../utils/password.js");
    const user = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      roles: input.roles,
      permissions: input.permissions,
      emailVerifiedAt: new Date(),
      isActive: true,
    });

    await logAdminActivity(request, { action: "staff.created", resourceType: "staff", resourceId: user._id, details: { email: user.email, roles: user.roles, permissions: user.permissions } });

    response.status(201).json({
      data: {
        staff: {
          id: objectIdString(user._id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          roles: user.roles,
          permissions: user.permissions,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/admin/staff/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update staff roles, permissions or active status; super administrator only
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Staff account updated
 *       403:
 *         description: Super administrator role required
 */
adminRouter.patch("/staff/:id", requireRoles("super_admin"), async (request, response, next) => {
  try {
    const id = objectIdSchema.parse(request.params.id);
    const input = staffUpdateSchema.parse(request.body);
    const staff = await User.findOne({ _id: id, roles: { $ne: "customer" } });
    if (!staff) throw new AppError(404, "STAFF_NOT_FOUND", "Staff account was not found.");
    if (input.name !== undefined) staff.name = input.name;
    if (input.phone !== undefined) staff.phone = input.phone;
    if (input.roles !== undefined) staff.roles = input.roles;
    if (input.permissions !== undefined) staff.permissions = input.permissions;
    if (input.isActive !== undefined) staff.isActive = input.isActive;
    await staff.save();
    await logAdminActivity(request, { action: "staff.updated", resourceType: "staff", resourceId: staff._id, details: { email: staff.email, roles: staff.roles, permissions: staff.permissions, isActive: staff.isActive } });
    response.json({
      data: {
        staff: {
          id: objectIdString(staff._id),
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          roles: staff.roles,
          permissions: staff.permissions,
          isActive: staff.isActive,
          createdAt: staff.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});










