import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Brand, Category, ConditionGrade, Product } from "../src/models/catalogue.js";
import { Order } from "../src/models/order.js";
import { Review } from "../src/models/review.js";
import { User } from "../src/models/user.js";
import { hashPassword } from "../src/utils/password.js";

function normalizeCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

async function clearCollections() {
  await Promise.all([
    Review.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Brand.deleteMany({}),
    Category.deleteMany({}),
    ConditionGrade.deleteMany({}),
    User.deleteMany({}),
  ]);
}

async function createUserCookies({ role = "customer", email = "customer@example.com" } = {}) {
  await User.create({
    name: role === "customer" ? "Ade Customer" : "Admin User",
    email,
    phone: "08012345678",
    passwordHash: await hashPassword("StrongPass123"),
    roles: [role],
    emailVerifiedAt: new Date(),
  });
  const login = await request(app).post("/api/v1/auth/login").send({ email, password: "StrongPass123" }).expect(200);
  return normalizeCookies(login.headers["set-cookie"]);
}

async function seedProduct() {
  const grade = await ConditionGrade.create({ code: "excellent", name: "Excellent", description: "Clean UK-used product.", sortOrder: 1 });
  const brand = await Brand.create({ name: "Apple", slug: "apple" });
  const category = await Category.create({ name: "Phones", slug: "phones" });
  return Product.create({
    name: "iPhone 13 Pro 256GB",
    slug: "iphone-13-pro-256gb",
    sku: "JAN-PHN-001",
    brandId: brand._id,
    categoryId: category._id,
    conditionGradeId: grade._id,
    priceKobo: 675_000_00,
    stockQuantity: 2,
    reservedQuantity: 0,
    shortDescription: "Unlocked UK-used iPhone.",
    description: "Tested UK-used iPhone.",
    visibleDefects: "Two faint frame marks.",
    includedAccessories: "USB-C cable only.",
    warrantyInformation: "30-day limited warranty.",
    availability: "in_stock",
    images: [{ cloudinaryPublicId: "demo/iphone", secureUrl: "https://example.com/iphone.jpg", altText: "iPhone", isPrimary: true }],
  });
}

async function seedPaidOrder(product, user) {
  return Order.create({
    orderNumber: "JAN-REVIEW-001",
    userId: user._id,
    customer: { name: user.name, email: user.email, phone: user.phone, addressLine1: "12 Allen Avenue", state: "Lagos", city: "Ikeja" },
    items: [{ productId: product._id, name: product.name, slug: product.slug, sku: product.sku, condition: "Excellent", unitPriceKobo: product.priceKobo, quantity: 1, lineSubtotalKobo: product.priceKobo }],
    subtotalKobo: product.priceKobo,
    discountKobo: 0,
    deliveryFeeKobo: 5_000_00,
    totalKobo: product.priceKobo + 5_000_00,
    currency: "NGN",
    deliveryMethod: "delivery",
    paymentStatus: "successful",
    orderStatus: "delivered",
    statusHistory: [{ status: "delivered", note: "Delivered." }],
    reservations: [],
  });
}

beforeAll(async () => {
  await connectMongo(true);
});

beforeEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await clearCollections();
  await disconnectMongo();
});

describe("product reviews", () => {
  it("allows a verified buyer to submit a pending review and admin to approve it", async () => {
    const product = await seedProduct();
    const customerCookies = await createUserCookies();
    const customer = await User.findOne({ email: "customer@example.com" }).lean();
    await seedPaidOrder(product, customer);

    const submitted = await request(app)
      .post(`/api/v1/products/${String(product._id)}/reviews`)
      .set("Cookie", customerCookies)
      .send({ rating: 5, title: "Exactly as described", comment: "The actual unit matched the listed condition." })
      .expect(201);

    expect(submitted.body.data.review).toMatchObject({ status: "pending", rating: 5, isVerifiedPurchase: true });

    const publicBeforeApproval = await request(app).get(`/api/v1/products/${String(product._id)}/reviews`).expect(200);
    expect(publicBeforeApproval.body.data.items).toHaveLength(0);

    const adminCookies = await createUserCookies({ role: "admin", email: "admin@example.com" });
    const approved = await request(app)
      .patch(`/api/v1/admin/reviews/${submitted.body.data.review.id}`)
      .set("Cookie", adminCookies)
      .send({ status: "approved", adminReply: "Thank you for your feedback." })
      .expect(200);

    expect(approved.body.data.review).toMatchObject({ status: "approved", adminReply: "Thank you for your feedback." });

    const productDetails = await request(app).get(`/api/v1/products/${product.slug}`).expect(200);
    expect(productDetails.body.data.product.reviewSummary).toMatchObject({ averageRating: 5, reviewCount: 1 });
    expect(productDetails.body.data.product.reviews[0]).toMatchObject({ title: "Exactly as described", isVerifiedPurchase: true });
  });

  it("requires login before submitting a review", async () => {
    const product = await seedProduct();

    const response = await request(app)
      .post(`/api/v1/products/${String(product._id)}/reviews`)
      .send({ rating: 4, title: "Good", comment: "Looks good from the listing." })
      .expect(401);

    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });
});