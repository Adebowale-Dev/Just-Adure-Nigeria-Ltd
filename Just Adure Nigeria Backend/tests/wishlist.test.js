import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { BackInStockAlert } from "../src/models/back-in-stock-alert.js";
import { Cart } from "../src/models/cart.js";
import { Brand, Category, ConditionGrade, Product } from "../src/models/catalogue.js";
import { EmailLog } from "../src/models/email-log.js";
import { Notification } from "../src/models/notification.js";
import { User } from "../src/models/user.js";
import { hashPassword } from "../src/utils/password.js";
import { Wishlist } from "../src/models/wishlist.js";

function normalizeCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

async function clearCollections() {
  await Promise.all([
    BackInStockAlert.deleteMany({}),
    Cart.deleteMany({}),
    EmailLog.deleteMany({}),
    Notification.deleteMany({}),
    Wishlist.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    Brand.deleteMany({}),
    Category.deleteMany({}),
    ConditionGrade.deleteMany({}),
  ]);
}

async function loginCustomer() {
  const payload = {
    name: "Wishlist Buyer",
    email: "wishlist@example.com",
    phone: "08012345678",
    password: "StrongPass123",
  };
  const response = await request(app).post("/api/v1/auth/register").send(payload).expect(201);
  return normalizeCookies(response.headers["set-cookie"]);
}


async function loginAdmin() {
  await User.create({
    name: "Inventory Admin",
    email: "inventory-admin@example.com",
    phone: "08099998888",
    passwordHash: await hashPassword("StrongPass123"),
    roles: ["admin"],
  });
  const response = await request(app).post("/api/v1/auth/login").send({ email: "inventory-admin@example.com", password: "StrongPass123" }).expect(200);
  return normalizeCookies(response.headers["set-cookie"]);
}
async function seedWishlistProduct(stockQuantity = 2) {
  const grade = await ConditionGrade.create({
    code: `excellent-${stockQuantity}`,
    name: "Excellent",
    description: "Very clean UK-used product with minimal signs of use.",
    sortOrder: 2,
  });
  const brand = await Brand.create({ name: `Apple ${stockQuantity}`, slug: `apple-${stockQuantity}` });
  const category = await Category.create({ name: `Phones ${stockQuantity}`, slug: `phones-${stockQuantity}` });
  return Product.create({
    name: `iPhone 13 Pro ${stockQuantity}`,
    slug: `iphone-13-pro-${stockQuantity}`,
    sku: `JAN-WIS-${stockQuantity}`,
    brandId: brand._id,
    categoryId: category._id,
    conditionGradeId: grade._id,
    priceKobo: 675_000_00,
    stockQuantity,
    reservedQuantity: 0,
    shortDescription: "Unlocked UK-used iPhone with strong battery health.",
    description: "A tested UK-used iPhone with actual condition notes.",
    visibleDefects: "Two faint frame marks.",
    includedAccessories: "USB-C cable only.",
    warrantyInformation: "30-day limited warranty.",
    colour: "Sierra Blue",
    modelNumber: "A2638",
    availability: stockQuantity > 0 ? "in_stock" : "out_of_stock",
    images: [{ cloudinaryPublicId: "demo/wishlist", secureUrl: "https://example.com/wishlist.jpg", altText: "Wishlist product", isPrimary: true }],
    specifications: [{ label: "Storage", value: "256GB" }],
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

describe("wishlist API", () => {
  it("requires authentication before reading a wishlist", async () => {
    const response = await request(app).get("/api/v1/wishlist").expect(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("adds, lists, and removes a wishlist product", async () => {
    const cookies = await loginCustomer();
    const product = await seedWishlistProduct();

    const added = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Cookie", cookies)
      .send({ productId: String(product._id) })
      .expect(200);

    expect(added.body.data.wishlist.itemCount).toBe(1);
    expect(added.body.data.wishlist.items[0]).toMatchObject({
      productId: String(product._id),
      name: product.name,
      isSoldOut: false,
    });

    const listed = await request(app).get("/api/v1/wishlist").set("Cookie", cookies).expect(200);
    expect(listed.body.data.wishlist.itemCount).toBe(1);

    const removed = await request(app)
      .delete(`/api/v1/wishlist/items/${String(product._id)}`)
      .set("Cookie", cookies)
      .expect(200);
    expect(removed.body.data.wishlist.itemCount).toBe(0);
  });

  it("moves an available wishlist product into the customer cart", async () => {
    const cookies = await loginCustomer();
    const product = await seedWishlistProduct();
    await request(app).post("/api/v1/wishlist/items").set("Cookie", cookies).send({ slug: product.slug }).expect(200);

    const moved = await request(app)
      .post(`/api/v1/wishlist/items/${String(product._id)}/move-to-cart`)
      .set("Cookie", cookies)
      .expect(200);

    expect(moved.body.data.movedToCart).toBe(true);
    expect(moved.body.data.wishlist.itemCount).toBe(0);

    const cart = await request(app).get("/api/v1/cart").set("Cookie", cookies).expect(200);
    expect(cart.body.data.cart.itemCount).toBe(1);
    expect(cart.body.data.cart.items[0].productId).toBe(String(product._id));
  });

  it("does not move sold-out wishlist products to cart", async () => {
    const cookies = await loginCustomer();
    const product = await seedWishlistProduct(0);
    await request(app).post("/api/v1/wishlist/items").set("Cookie", cookies).send({ productId: String(product._id) }).expect(200);

    const response = await request(app)
      .post(`/api/v1/wishlist/items/${String(product._id)}/move-to-cart`)
      .set("Cookie", cookies)
      .expect(409);

    expect(response.body.error.code).toBe("PRODUCT_SOLD_OUT");
  });
  it("notifies subscribed customers when an admin restocks a sold-out product", async () => {
    const customerCookies = await loginCustomer();
    const adminCookies = await loginAdmin();
    const product = await seedWishlistProduct(0);
    const customer = await User.findOne({ email: "wishlist@example.com" }).lean();

    const subscription = await request(app)
      .post("/api/v1/stock-alerts")
      .set("Cookie", customerCookies)
      .send({ productId: String(product._id) })
      .expect(200);

    expect(subscription.body.data.alert).toMatchObject({ productId: String(product._id), status: "active" });

    await request(app)
      .patch(`/api/v1/admin/products/${String(product._id)}/stock`)
      .set("Cookie", adminCookies)
      .send({ stockQuantity: 2 })
      .expect(200);

    const alert = await BackInStockAlert.findOne({ productId: product._id }).lean();
    expect(alert.status).toBe("notified");
    expect(alert.notifiedAt).toBeTruthy();

    const notification = await Notification.findOne({ recipientUserId: customer._id, resourceId: String(product._id) }).lean();
    expect(notification).toMatchObject({ title: "Product back in stock", type: "inventory" });

    const email = await EmailLog.findOne({ recipientEmail: customer.email, template: "back_in_stock_customer" }).lean();
    expect(email).toMatchObject({ status: "skipped", subject: `${product.name} is back in stock` });
  });
});