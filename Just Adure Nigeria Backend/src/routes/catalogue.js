import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { Brand, Category, ConditionGrade, Product, productAvailability } from "../models/catalogue.js";
import { Review } from "../models/review.js";
import { serializeReview } from "./reviews.js";
export const catalogueRouter = Router();
const listProductsQuerySchema = z.object({
    q: z.string().trim().min(1).max(120).optional(),
    category: z.string().trim().min(1).max(120).optional(),
    brand: z.string().trim().min(1).max(120).optional(),
    condition: z.string().trim().min(1).max(120).optional(),
    availability: z.enum(productAvailability).optional(),
    colour: z.string().trim().min(1).max(80).optional(),
    warranty: z.enum(["true", "false"]).optional(),
    discount: z.enum(["true", "false"]).optional(),
    featured: z.enum(["true", "false"]).optional(),
    minPriceKobo: z.coerce.number().int().min(0).optional(),
    maxPriceKobo: z.coerce.number().int().min(0).optional(),
    sort: z.enum(["newest", "oldest", "price_asc", "price_desc", "popular", "best_rated"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
});
const slugParamSchema = z.object({ slug: z.string().trim().min(1).max(180) });
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function objectIdString(value) {
    if (value instanceof mongoose.Types.ObjectId) {
        return value.toHexString();
    }
    if (value && typeof value === "object" && "_id" in value) {
        return objectIdString(value._id);
    }
    return String(value);
}
function serializeLookup(record) {
    if (!record) {
        return null;
    }
    return {
        id: objectIdString(record._id),
        name: record.name,
        slug: record.slug,
        code: record.code,
        description: record.description,
    };
}
function serializeProduct(product) {
    const availableQuantity = Math.max(0, Number(product.stockQuantity ?? 0) - Number(product.reservedQuantity ?? 0));
    const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0] ?? null;
    return {
        id: objectIdString(product._id),
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        brand: serializeLookup(product.brandId),
        category: serializeLookup(product.categoryId),
        productType: product.productType ?? "used",
        conditionGrade: serializeLookup(product.conditionGradeId),
        priceKobo: product.priceKobo,
        previousPriceKobo: product.previousPriceKobo ?? null,
        currency: "NGN",
        stockQuantity: product.stockQuantity,
        reservedQuantity: product.reservedQuantity,
        availableQuantity,
        isSoldOut: availableQuantity <= 0 || product.availability === "out_of_stock",
        shortDescription: product.shortDescription,
        description: product.description,
        visibleDefects: product.visibleDefects ?? null,
        includedAccessories: product.includedAccessories ?? null,
        warrantyInformation: product.warrantyInformation ?? null,
        colour: product.colour ?? null,
        modelNumber: product.modelNumber ?? null,
        availability: product.availability,
        isFeatured: product.isFeatured,
        seoTitle: product.seoTitle ?? null,
        seoDescription: product.seoDescription ?? null,
        primaryImage,
        images: product.images ?? [],
        specifications: product.specifications ?? [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}
async function findLookupId(model, value) {
    const matcher = new RegExp(`^${escapeRegExp(value)}$`, "i");
    const record = await model.findOne({ $or: [{ slug: matcher }, { name: matcher }, { code: matcher }] }).select("_id").lean();
    return record?._id;
}
function sortFor(value) {
    switch (value) {
        case "oldest":
            return { createdAt: 1 };
        case "price_asc":
            return { priceKobo: 1, createdAt: -1 };
        case "price_desc":
            return { priceKobo: -1, createdAt: -1 };
        case "popular":
        case "best_rated":
            return { isFeatured: -1, createdAt: -1 };
        case "newest":
        default:
            return { createdAt: -1 };
    }
}
/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     tags: [Catalogue]
 *     summary: List public products with search, filters, sorting and pagination
 *     responses:
 *       200:
 *         description: Product list returned
 */
catalogueRouter.get("/products", async (request, response, next) => {
    try {
        const query = listProductsQuerySchema.parse(request.query);
        const filter = { isArchived: false, availability: { $ne: "archived" } };
        const andFilters = [];
        if (query.category) {
            const categoryId = await findLookupId(Category, query.category);
            if (!categoryId) {
                response.json({ data: { items: [], meta: { page: query.page, limit: query.limit, totalItems: 0, totalPages: 0 } } });
                return;
            }
            filter.categoryId = categoryId;
        }
        if (query.brand) {
            const brandId = await findLookupId(Brand, query.brand);
            if (!brandId) {
                response.json({ data: { items: [], meta: { page: query.page, limit: query.limit, totalItems: 0, totalPages: 0 } } });
                return;
            }
            filter.brandId = brandId;
        }
        if (query.condition) {
            const conditionGradeId = await findLookupId(ConditionGrade, query.condition);
            if (!conditionGradeId) {
                response.json({ data: { items: [], meta: { page: query.page, limit: query.limit, totalItems: 0, totalPages: 0 } } });
                return;
            }
            filter.conditionGradeId = conditionGradeId;
        }
        if (query.availability) {
            filter.availability = query.availability;
        }
        if (query.colour) {
            filter.colour = new RegExp(escapeRegExp(query.colour), "i");
        }
        if (query.featured) {
            filter.isFeatured = query.featured === "true";
        }
        if (query.warranty === "true") {
            filter.warrantyInformation = { $exists: true, $ne: "" };
        }
        if (query.discount === "true") {
            andFilters.push({ previousPriceKobo: { $exists: true, $ne: null } });
        }
        if (query.minPriceKobo !== undefined || query.maxPriceKobo !== undefined) {
            filter.priceKobo = {};
            if (query.minPriceKobo !== undefined) {
                filter.priceKobo.$gte = query.minPriceKobo;
            }
            if (query.maxPriceKobo !== undefined) {
                filter.priceKobo.$lte = query.maxPriceKobo;
            }
        }
        if (query.q) {
            const search = new RegExp(escapeRegExp(query.q), "i");
            const [matchingBrands, matchingCategories] = await Promise.all([
                Brand.find({ $or: [{ name: search }, { slug: search }] }).select("_id").lean(),
                Category.find({ $or: [{ name: search }, { slug: search }] }).select("_id").lean(),
            ]);
            andFilters.push({
                $or: [
                    { name: search },
                    { slug: search },
                    { sku: search },
                    { modelNumber: search },
                    { shortDescription: search },
                    { description: search },
                    { brandId: { $in: matchingBrands.map((brand) => brand._id) } },
                    { categoryId: { $in: matchingCategories.map((category) => category._id) } },
                ],
            });
        }
        const finalFilter = andFilters.length > 0 ? { ...filter, $and: andFilters } : filter;
        const skip = (query.page - 1) * query.limit;
        const [products, totalItems] = await Promise.all([
            Product.find(finalFilter)
                .populate("brandId")
                .populate("categoryId")
                .populate("conditionGradeId")
                .sort(sortFor(query.sort))
                .skip(skip)
                .limit(query.limit)
                .lean(),
            Product.countDocuments(finalFilter),
        ]);
        response.json({
            data: {
                items: products.map((product) => serializeProduct(product)),
                meta: {
                    page: query.page,
                    limit: query.limit,
                    totalItems,
                    totalPages: Math.ceil(totalItems / query.limit),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/products/{slug}:
 *   get:
 *     tags: [Catalogue]
 *     summary: Get public product details by slug
 *     responses:
 *       200:
 *         description: Product details returned
 *       404:
 *         description: Product not found
 */
catalogueRouter.get("/products/:slug", async (request, response, next) => {
    try {
        const { slug } = slugParamSchema.parse(request.params);
        const product = await Product.findOne({ slug, isArchived: false, availability: { $ne: "archived" } })
            .populate("brandId")
            .populate("categoryId")
            .populate("conditionGradeId")
            .lean();
        if (!product) {
            throw new AppError(404, "PRODUCT_NOT_FOUND", "The requested product was not found.");
        }
        const reviews = await Review.find({ productId: product._id, status: "approved" }).sort({ createdAt: -1 }).limit(20).lean();
        const reviewAverage = reviews.length > 0 ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;
        response.json({ data: { product: { ...serializeProduct(product), reviews: reviews.map(serializeReview), reviewSummary: { averageRating: reviewAverage, reviewCount: reviews.length } } } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     tags: [Catalogue]
 *     summary: List active categories
 *     responses:
 *       200:
 *         description: Categories returned
 */
catalogueRouter.get("/categories", async (_request, response, next) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
        response.json({ data: { items: categories.map((category) => serializeLookup(category)) } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/brands:
 *   get:
 *     tags: [Catalogue]
 *     summary: List active brands
 *     responses:
 *       200:
 *         description: Brands returned
 */
catalogueRouter.get("/brands", async (_request, response, next) => {
    try {
        const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();
        response.json({ data: { items: brands.map((brand) => serializeLookup(brand)) } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @openapi
 * /api/v1/condition-grades:
 *   get:
 *     tags: [Catalogue]
 *     summary: List active UK-used condition grades
 *     responses:
 *       200:
 *         description: Condition grades returned
 */
catalogueRouter.get("/condition-grades", async (_request, response, next) => {
    try {
        const grades = await ConditionGrade.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
        response.json({ data: { items: grades.map((grade) => serializeLookup(grade)) } });
    }
    catch (error) {
        next(error);
    }
});
