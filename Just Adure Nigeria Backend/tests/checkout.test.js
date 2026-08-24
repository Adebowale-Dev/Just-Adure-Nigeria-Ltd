import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Cart } from "../src/models/cart.js";
import { Coupon } from "../src/models/coupon.js";
import { Brand, Category, ConditionGrade, DeliveryZone, Product } from "../src/models/catalogue.js";
import { Order } from "../src/models/order.js";

function normalizeCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

async function clearCollections() {
  await Promise.all([
    Order.deleteMany({}),
    Coupon.deleteMany({}),
    Cart.deleteMany({}),
    Product.deleteMany({}),
    DeliveryZone.deleteMany({}),
    Brand.deleteMany({}),
    Category.deleteMany({}),
    ConditionGrade.deleteMany({}),
  ]);
}

async function seedProduct(stockQuantity = 1) {
  const grade = await ConditionGrade.create({
    code: "excellent",
    name: "Excellent",
    description: "Very clean UK-used product with minimal signs of use.",
    sortOrder: 2,
  });
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
    images: [
      {
        cloudinaryPublicId: "demo/iphone",
        secureUrl: "https://example.com/iphone.jpg",
        altText: "iPhone 13 Pro actual unit",
        isPrimary: true,
      },
    ],
    specifications: [{ label: "Storage", value: "256GB" }],
  });
}

async function seedDeliveryZone() {
  return DeliveryZone.create({
    code: "lagos-mainland",
    name: "Lagos Mainland",
    state: "Lagos",
    cityPattern: "Ikeja|Yaba|Surulere",
    feeKobo: 5_000_00,
    minDeliveryDays: 1,
    maxDeliveryDays: 3,
    priority: 10,
    isActive: true,
  });
}

function checkoutPayload(overrides = {}) {
  return {
    customer: {
      name: "Ade Customer",
      email: "customer@example.com",
      phone: "08012345678",
      addressLine1: "12 Allen Avenue",
      state: "Lagos",
      city: "Ikeja",
      deliveryInstructions: "Call before delivery.",
    },
    deliveryMethod: "delivery",
    ...overrides,
  };
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

describe("checkout API", () => {
  it("calculates delivery fees from backend delivery zones", async () => {
    await seedDeliveryZone();

    const response = await request(app)
      .post("/api/v1/checkout/delivery-fee")
      .send({ state: "Lagos", city: "Ikeja", deliveryMethod: "delivery" })
      .expect(200);

    expect(response.body.data).toMatchObject({
      currency: "NGN",
      deliveryFeeKobo: 5_000_00,
      zone: { name: "Lagos Mainland", state: "Lagos" },
    });
  });

  it("creates a pending order using backend totals and reserves inventory", async () => {
    const product = await seedProduct(1);
    await seedDeliveryZone();

    const add = await request(app)
      .post("/api/v1/cart/items")
      .send({ productId: String(product._id), quantity: 1 })
      .expect(200);
    const cookies = normalizeCookies(add.headers["set-cookie"]);

    const response = await request(app)
      .post("/api/v1/checkout")
      .set("Cookie", cookies)
      .send(checkoutPayload())
      .expect(201);

    expect(response.body.data.order).toMatchObject({
      paymentStatus: "pending",
      orderStatus: "pending_payment",
      currency: "NGN",
      subtotalKobo: 675_000_00,
      deliveryFeeKobo: 5_000_00,
      totalKobo: 680_000_00,
    });
    expect(response.body.data.order.items[0]).toMatchObject({
      productId: String(product._id),
      sku: "JAN-PHN-001",
      quantity: 1,
      unitPriceKobo: 675_000_00,
      lineSubtotalKobo: 675_000_00,
    });

    const updatedProduct = await Product.findById(product._id).lean();
    const cart = await Cart.findOne({ cartKey: /^guest:/ }).lean();
    const order = await Order.findOne({ orderNumber: response.body.data.order.orderNumber }).lean();

    expect(updatedProduct.reservedQuantity).toBe(1);
    expect(cart.items).toHaveLength(0);
    expect(order.reservations[0]).toMatchObject({ quantity: 1 });
  });

  it("applies valid coupon discounts using backend totals", async () => {
    const product = await seedProduct(1);
    await seedDeliveryZone();
    await Coupon.create({
      code: "SAVE10",
      name: "Launch discount",
      type: "percentage",
      percentage: 10,
      minOrderAmountKobo: 100_000_00,
      maxDiscountKobo: 80_000_00,
      isActive: true,
    });

    const add = await request(app)
      .post("/api/v1/cart/items")
      .send({ productId: String(product._id), quantity: 1 })
      .expect(200);

    const response = await request(app)
      .post("/api/v1/checkout")
      .set("Cookie", normalizeCookies(add.headers["set-cookie"]))
      .send(checkoutPayload({ couponCode: "save10" }))
      .expect(201);

    expect(response.body.data.order).toMatchObject({
      subtotalKobo: 675_000_00,
      discountKobo: 67_500_00,
      deliveryFeeKobo: 5_000_00,
      totalKobo: 612_500_00,
      coupon: { code: "SAVE10" },
    });

    const order = await Order.findOne({ orderNumber: response.body.data.order.orderNumber }).lean();
    expect(order).toMatchObject({ couponCode: "SAVE10", discountKobo: 67_500_00 });
  });

  it("rejects disabled coupons before reserving inventory", async () => {
    const product = await seedProduct(1);
    await seedDeliveryZone();
    await Coupon.create({ code: "OFF", name: "Disabled", type: "fixed", valueKobo: 10_000_00, isActive: false });

    const add = await request(app)
      .post("/api/v1/cart/items")
      .send({ productId: String(product._id), quantity: 1 })
      .expect(200);

    const response = await request(app)
      .post("/api/v1/checkout")
      .set("Cookie", normalizeCookies(add.headers["set-cookie"]))
      .send(checkoutPayload({ couponCode: "OFF" }))
      .expect(409);

    const updatedProduct = await Product.findById(product._id).lean();
    expect(response.body.error.code).toBe("COUPON_DISABLED");
    expect(updatedProduct.reservedQuantity).toBe(0);
  });
  it("rejects checkout when the cart is empty", async () => {
    await seedDeliveryZone();

    const response = await request(app).post("/api/v1/checkout").send(checkoutPayload()).expect(400);

    expect(response.body.error.code).toBe("CART_NOT_FOUND");
  });

  it("prevents checkout when another reservation has consumed available stock", async () => {
    const product = await seedProduct(1);
    await seedDeliveryZone();

    const add = await request(app)
      .post("/api/v1/cart/items")
      .send({ productId: String(product._id), quantity: 1 })
      .expect(200);
    await Product.updateOne({ _id: product._id }, { reservedQuantity: 1 });

    const response = await request(app)
      .post("/api/v1/checkout")
      .set("Cookie", normalizeCookies(add.headers["set-cookie"]))
      .send(checkoutPayload())
      .expect(409);

    const updatedProduct = await Product.findById(product._id).lean();

    expect(response.body.error.code).toBe("PRODUCT_SOLD_OUT");
    expect(updatedProduct.reservedQuantity).toBe(1);
  });
});
