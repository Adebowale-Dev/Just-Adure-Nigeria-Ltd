import mongoose from "mongoose";
import { HomepageContent } from "../models/homepage-content.js";
import { Category, Product } from "../models/catalogue.js";

function objectIdString(value) {
  if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
  if (value && typeof value === "object" && "_id" in value) return objectIdString(value._id);
  return String(value);
}

function serializeLookup(record) {
  if (!record) return null;
  return { id: objectIdString(record._id), name: record.name, slug: record.slug, code: record.code };
}

export function serializeHomepageProduct(product) {
  const availableQuantity = Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
  const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0] ?? null;
  return {
    id: objectIdString(product._id),
    name: product.name,
    slug: product.slug,
    priceKobo: product.priceKobo,
    previousPriceKobo: product.previousPriceKobo ?? null,
    conditionGrade: serializeLookup(product.conditionGradeId),
    category: serializeLookup(product.categoryId),
    brand: serializeLookup(product.brandId),
    primaryImage,
    visibleDefects: product.visibleDefects ?? null,
    isSoldOut: availableQuantity <= 0 || product.availability === "out_of_stock",
  };
}

export function serializeHomepageContent(content) {
  return {
    id: objectIdString(content._id),
    heroEyebrow: content.heroEyebrow,
    heroTitle: content.heroTitle,
    heroSubtitle: content.heroSubtitle,
    heroPrimaryCtaLabel: content.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: content.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: content.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: content.heroSecondaryCtaHref,
    promoTitle: content.promoTitle,
    promoSubtitle: content.promoSubtitle,
    trustTitle: content.trustTitle,
    trustSubtitle: content.trustSubtitle,
    banners: (content.banners ?? []).map((banner) => ({
      id: objectIdString(banner._id),
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl ?? "",
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    })),
    updatedAt: content.updatedAt,
  };
}

export async function getHomepageContent() {
  return HomepageContent.findOneAndUpdate(
    { singletonKey: "homepage-content" },
    { $setOnInsert: { singletonKey: "homepage-content" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}

export async function getPublicHomepage() {
  const [content, featuredProducts, categories] = await Promise.all([
    getHomepageContent(),
    Product.find({ isArchived: false, availability: { $ne: "archived" }, isFeatured: true }).populate("brandId").populate("categoryId").populate("conditionGradeId").sort({ createdAt: -1 }).limit(6).lean(),
    Category.find({ isActive: true }).sort({ name: 1 }).limit(8).lean(),
  ]);
  const products = featuredProducts.length > 0
    ? featuredProducts
    : await Product.find({ isArchived: false, availability: { $ne: "archived" } }).populate("brandId").populate("categoryId").populate("conditionGradeId").sort({ createdAt: -1 }).limit(6).lean();
  return {
    content: serializeHomepageContent(content),
    featuredProducts: products.map(serializeHomepageProduct),
    categories: categories.map(serializeLookup),
  };
}