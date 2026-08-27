import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Brand, Category, ConditionGrade, DeliveryZone, Product } from "../src/models/catalogue.js";
import { AdminActivityLog } from "../src/models/admin-activity-log.js";
import { HomepageContent } from "../src/models/homepage-content.js";
import { NewsletterSubscriber } from "../src/models/newsletter-subscriber.js";
import { Coupon } from "../src/models/coupon.js";
import { Order } from "../src/models/order.js";
import { Payment } from "../src/models/payment.js";
import { ReturnRequest } from "../src/models/return-request.js";
import { User } from "../src/models/user.js";
import { hashPassword } from "../src/utils/password.js";

function normalizeCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

async function clearCollections() {
  await Promise.all([
    AdminActivityLog.deleteMany({}),
    HomepageContent.deleteMany({}),
    NewsletterSubscriber.deleteMany({}),
    Payment.deleteMany({}),
    ReturnRequest.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    DeliveryZone.deleteMany({}),
    Brand.deleteMany({}),
    Category.deleteMany({}),
    ConditionGrade.deleteMany({}),
    User.deleteMany({}),
  ]);
}

async function createAdminCookies(role = "admin", email = "admin@example.com") {
  await User.create({
    name: "Admin User",
    email,
    phone: "08012345678",
    passwordHash: await hashPassword("StrongPass123"),
    roles: [role],
  });
  const login = await request(app).post("/api/v1/auth/login").send({ email, password: "StrongPass123" }).expect(200);
  return normalizeCookies(login.headers["set-cookie"]);
}

async function seedLookups() {
  const grade = await ConditionGrade.create({ code: "excellent", name: "Excellent", description: "Clean UK-used product.", sortOrder: 1 });
  const brand = await Brand.create({ name: "Apple", slug: "apple" });
  const category = await Category.create({ name: "Phones", slug: "phones" });
  return { grade, brand, category };
}

async function seedProduct() {
  const { grade, brand, category } = await seedLookups();
  const product = await Product.create({
    name: "iPhone 13 Pro 256GB",
    slug: "iphone-13-pro-256gb",
    sku: "JAN-PHN-001",
    brandId: brand._id,
    categoryId: category._id,
    conditionGradeId: grade._id,
    priceKobo: 675_000_00,
    stockQuantity: 3,
    reservedQuantity: 0,
    lowStockThreshold: 1,
    shortDescription: "Unlocked UK-used iPhone.",
    description: "Tested UK-used iPhone.",
    visibleDefects: "Two faint frame marks.",
    includedAccessories: "USB-C cable only.",
    warrantyInformation: "30-day limited warranty.",
    colour: "Sierra Blue",
    modelNumber: "A2638",
    availability: "in_stock",
    images: [{ cloudinaryPublicId: "demo/iphone", secureUrl: "https://example.com/iphone.jpg", altText: "iPhone", isPrimary: true }],
    specifications: [{ label: "Storage", value: "256GB" }],
  });
  return { product, grade, brand, category };
}

async function seedOrder() {
  return Order.create({
    orderNumber: "JAN-ADMIN-001",
    customer: { name: "Ade Customer", email: "customer@example.com", phone: "08012345678", addressLine1: "12 Allen Avenue", state: "Lagos", city: "Ikeja" },
    items: [{ productId: new mongoose.Types.ObjectId(), name: "iPhone 13 Pro", slug: "iphone-13-pro", sku: "JAN-PHN-001", condition: "Excellent", unitPriceKobo: 675_000_00, quantity: 1, lineSubtotalKobo: 675_000_00 }],
    subtotalKobo: 675_000_00,
    discountKobo: 0,
    deliveryFeeKobo: 5_000_00,
    totalKobo: 680_000_00,
    currency: "NGN",
    deliveryMethod: "delivery",
    paymentStatus: "successful",
    orderStatus: "paid",
    statusHistory: [{ status: "paid", note: "Payment verified." }],
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

describe("admin API", () => {
  it("protects admin dashboard from guests", async () => {
    const response = await request(app).get("/api/v1/admin/dashboard").expect(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("allows an admin to create and archive a product", async () => {
    const cookies = await createAdminCookies();
    const { grade, brand, category } = await seedLookups();

    const create = await request(app)
      .post("/api/v1/admin/products")
      .set("Cookie", cookies)
      .send({
        name: "MacBook Pro 2020",
        slug: "macbook-pro-2020",
        sku: "JAN-LAP-2020",
        brandId: String(brand._id),
        categoryId: String(category._id),
        conditionGradeId: String(grade._id),
        priceKobo: 850_000_00,
        stockQuantity: 1,
        shortDescription: "Tested UK-used MacBook.",
        description: "Actual unit with charger included.",
        visibleDefects: "Light lid scratch.",
        includedAccessories: "Charger included.",
        warrantyInformation: "14-day limited warranty.",
        images: [{ cloudinaryPublicId: "demo/macbook", secureUrl: "https://example.com/macbook.jpg", altText: "MacBook actual unit", isPrimary: true }],
      })
      .expect(201);

    expect(create.body.data.product).toMatchObject({ sku: "JAN-LAP-2020", availability: "low_stock" });

    await request(app).delete(`/api/v1/admin/products/${create.body.data.product.id}`).set("Cookie", cookies).expect(204);
    const archived = await Product.findById(create.body.data.product.id).lean();
    expect(archived.isArchived).toBe(true);
    expect(archived.availability).toBe("archived");
  });

  it("allows an admin to update inventory status", async () => {
    const cookies = await createAdminCookies();
    const { product } = await seedProduct();

    const response = await request(app)
      .patch(`/api/v1/admin/products/${String(product._id)}/stock`)
      .set("Cookie", cookies)
      .send({ stockQuantity: 0 })
      .expect(200);

    expect(response.body.data.product).toMatchObject({ stockQuantity: 0, availability: "out_of_stock" });
  });

  it("allows an admin to update order status and dashboard stats", async () => {
    const cookies = await createAdminCookies();
    const order = await seedOrder();
    await Payment.create({ orderId: order._id, orderNumber: order.orderNumber, reference: "JAN-PAID-ADMIN", amountKobo: order.totalKobo, currency: "NGN", status: "successful", customerEmail: order.customer.email });

    const updated = await request(app)
      .patch(`/api/v1/admin/orders/${String(order._id)}/status`)
      .set("Cookie", cookies)
      .send({ status: "processing", note: "Packed for inspection." })
      .expect(200);

    expect(updated.body.data.order).toMatchObject({ orderStatus: "processing" });

    const dashboard = await request(app).get("/api/v1/admin/dashboard").set("Cookie", cookies).expect(200);
    expect(dashboard.body.data.stats).toMatchObject({ totalOrders: 1, paidOrders: 1, totalRevenueKobo: 680_000_00 });
  });
  it("allows an admin to create, update, and list coupons", async () => {
    const cookies = await createAdminCookies();

    const create = await request(app)
      .post("/api/v1/admin/coupons")
      .set("Cookie", cookies)
      .send({
        code: "launch10",
        name: "Launch 10 percent",
        type: "percentage",
        percentage: 10,
        minOrderAmountKobo: 100_000_00,
        maxDiscountKobo: 50_000_00,
        usageLimit: 25,
      })
      .expect(201);

    expect(create.body.data.coupon).toMatchObject({ code: "LAUNCH10", type: "percentage", percentage: 10 });

    const update = await request(app)
      .patch(`/api/v1/admin/coupons/${create.body.data.coupon.id}`)
      .set("Cookie", cookies)
      .send({ isActive: false })
      .expect(200);

    expect(update.body.data.coupon).toMatchObject({ code: "LAUNCH10", isActive: false });

    const list = await request(app).get("/api/v1/admin/coupons").set("Cookie", cookies).expect(200);
    expect(list.body.data.items).toHaveLength(1);
  });
  it("allows a super admin to create staff accounts", async () => {
    const cookies = await createAdminCookies("super_admin", "super@example.com");

    const response = await request(app)
      .post("/api/v1/admin/staff")
      .set("Cookie", cookies)
      .send({
        name: "Inventory Manager",
        email: "inventory@example.com",
        phone: "08022223333",
        password: "StrongPass123",
        roles: ["inventory_manager"],
        permissions: ["products:update_stock"],
      })
      .expect(201);

    expect(response.body.data.staff).toMatchObject({ email: "inventory@example.com", roles: ["inventory_manager"], permissions: ["products:update_stock"] });
    const staff = await User.findOne({ email: "inventory@example.com" }).lean();
    expect(staff.passwordHash).toBeUndefined();
  });

  it("prevents normal admins from creating staff accounts", async () => {
    const cookies = await createAdminCookies();

    const response = await request(app)
      .post("/api/v1/admin/staff")
      .set("Cookie", cookies)
      .send({
        name: "Order Manager",
        email: "orders@example.com",
        phone: "08022224444",
        password: "StrongPass123",
        roles: ["order_manager"],
      })
      .expect(403);

    expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSION");
  });

  it("returns filtered reports and CSV exports", async () => {
    const cookies = await createAdminCookies();
    const order = await seedOrder();
    await Payment.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      reference: "JAN-REPORT-001",
      amountKobo: order.totalKobo,
      currency: "NGN",
      status: "successful",
      customerEmail: order.customer.email,
    });
    await ReturnRequest.create({
      requestNumber: "RET-REPORT-001",
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      reason: "not_as_described",
      details: "Refund captured for reporting.",
      items: [{ productId: order.items[0].productId, sku: order.items[0].sku, name: order.items[0].name, quantity: 1 }],
      status: "refunded",
      refundAmountKobo: 125_000_00,
      refundReference: "RFND-REPORT-001",
      refundProcessedAt: new Date(),
    });

    const report = await request(app).get("/api/v1/admin/reports?range=today&paymentStatus=successful").set("Cookie", cookies).expect(200);
    expect(report.body.data.summary).toMatchObject({ totalOrders: 1, paidOrders: 1, totalRevenueKobo: 680_000_00, totalRefundedKobo: 125_000_00 });
    expect(report.body.data.bestSellingProducts[0]).toMatchObject({ sku: "JAN-PHN-001", quantitySold: 1 });

    const csv = await request(app).get("/api/v1/admin/reports/orders.csv?range=today").set("Cookie", cookies).expect(200);
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.text).toContain("Order Number");
    expect(csv.text).toContain("JAN-ADMIN-001");

    const paymentsCsv = await request(app).get("/api/v1/admin/reports/payments.csv?range=today&paymentStatus=successful").set("Cookie", cookies).expect(200);
    expect(paymentsCsv.headers["content-type"]).toContain("text/csv");
    expect(paymentsCsv.text).toContain("Reference");
    expect(paymentsCsv.text).toContain("JAN-REPORT-001");
  });
  it("enforces scoped staff permissions", async () => {
    const inventoryCookies = await createAdminCookies("inventory_manager", "inventory@example.com");
    const { product } = await seedProduct();
    const order = await seedOrder();

    await request(app)
      .patch(`/api/v1/admin/products/${String(product._id)}/stock`)
      .set("Cookie", inventoryCookies)
      .send({ stockQuantity: 2 })
      .expect(200);

    await request(app)
      .post("/api/v1/admin/products")
      .set("Cookie", inventoryCookies)
      .send({})
      .expect(403);

    await request(app)
      .patch(`/api/v1/admin/orders/${String(order._id)}/status`)
      .set("Cookie", inventoryCookies)
      .send({ status: "processing" })
      .expect(403);

    const orderCookies = await createAdminCookies("order_manager", "orders@example.com");
    await request(app)
      .patch(`/api/v1/admin/orders/${String(order._id)}/status`)
      .set("Cookie", orderCookies)
      .send({ status: "processing" })
      .expect(200);

    await request(app)
      .post("/api/v1/admin/coupons")
      .set("Cookie", orderCookies)
      .send({ code: "ORDERMANAGER", name: "Should fail", type: "percentage", percentage: 10 })
      .expect(403);
  });

  it("allows super administrators to update staff permissions and status", async () => {
    const cookies = await createAdminCookies("super_admin", "super-owner@example.com");
    const create = await request(app)
      .post("/api/v1/admin/staff")
      .set("Cookie", cookies)
      .send({
        name: "Support Agent",
        email: "support-agent@example.com",
        phone: "08033334444",
        password: "StrongPass123",
        roles: ["customer_support"],
        permissions: ["dashboard:view", "support:manage"],
      })
      .expect(201);

    const update = await request(app)
      .patch(`/api/v1/admin/staff/${create.body.data.staff.id}`)
      .set("Cookie", cookies)
      .send({ permissions: ["dashboard:view", "support:manage", "returns:manage"], isActive: false })
      .expect(200);

    expect(update.body.data.staff).toMatchObject({ email: "support-agent@example.com", isActive: false, permissions: ["dashboard:view", "support:manage", "returns:manage"] });
  });
  it("manages store settings as super administrator", async () => {
    const adminCookies = await createAdminCookies("admin", "settings-admin@example.com");
    await request(app).patch("/api/v1/admin/store-settings").set("Cookie", adminCookies).send({ storeName: "Blocked Store" }).expect(403);

    const publicSettings = await request(app).get("/api/v1/store-settings").expect(200);
    expect(publicSettings.body.data.settings).toMatchObject({ storeName: "Just Adure Nigeria Ltd", defaultCurrency: "NGN" });
    expect(publicSettings.body.data.settings.maintenanceMode).toBeUndefined();

    const superCookies = await createAdminCookies("super_admin", "settings-super@example.com");
    const update = await request(app)
      .patch("/api/v1/admin/store-settings")
      .set("Cookie", superCookies)
      .send({
        storeName: "Just Adure Nigeria Ltd",
        contactEmail: "support@justadure.ng",
        phoneNumber: "08012345678",
        whatsappNumber: "08012345678",
        storeAddress: "Ikeja, Lagos",
        defaultCurrency: "NGN",
        taxRatePercent: 0,
        defaultDeliveryInformation: "Delivery is calculated at checkout.",
        returnPeriodDays: 7,
        warrantyInformation: "Warranty depends on the item condition.",
        maintenanceMode: true,
        maintenanceMessage: "Short maintenance window.",
        socialLinks: { instagram: "https://instagram.com/justadure" },
      })
      .expect(200);

    expect(update.body.data.settings).toMatchObject({ contactEmail: "support@justadure.ng", maintenanceMode: true, returnPeriodDays: 7 });
    expect(update.body.data.settings.socialLinks).toMatchObject({ instagram: "https://instagram.com/justadure" });
  });
  it("records and lists administrator activity logs", async () => {
    const cookies = await createAdminCookies("super_admin", "audit-super@example.com");
    const { product } = await seedProduct();

    await request(app)
      .patch(`/api/v1/admin/products/${String(product._id)}/stock`)
      .set("Cookie", cookies)
      .set("X-Request-ID", "audit-test-request")
      .send({ stockQuantity: 2 })
      .expect(200);

    const storedLog = await AdminActivityLog.findOne({ action: "inventory.updated" }).lean();
    expect(storedLog).toMatchObject({ resourceType: "product", requestId: "audit-test-request" });
    expect(storedLog.details).toMatchObject({ sku: "JAN-PHN-001", stockQuantity: 2 });

    const logs = await request(app).get("/api/v1/admin/activity-logs").set("Cookie", cookies).expect(200);
    expect(logs.body.data.items[0]).toMatchObject({ action: "inventory.updated", administratorEmail: "audit-super@example.com" });

    const adminCookies = await createAdminCookies("admin", "audit-admin@example.com");
    await request(app).get("/api/v1/admin/activity-logs").set("Cookie", adminCookies).expect(403);
  });
  it("manages homepage content and public homepage data", async () => {
    const cookies = await createAdminCookies("super_admin", "homepage-super@example.com");
    await seedProduct();

    const update = await request(app)
      .patch("/api/v1/admin/homepage-content")
      .set("Cookie", cookies)
      .send({
        heroEyebrow: "Managed storefront",
        heroTitle: "Updated UK-used deals",
        heroSubtitle: "Fresh homepage content from the admin dashboard.",
        promoSubtitle: "Admin picks",
        banners: [{ title: "Weekend deals", subtitle: "Discounted UK-used products.", ctaLabel: "Shop deals", ctaHref: "/shop?discount=true", isActive: true, sortOrder: 0 }],
      })
      .expect(200);

    expect(update.body.data.content).toMatchObject({ heroEyebrow: "Managed storefront", heroTitle: "Updated UK-used deals" });
    expect(update.body.data.content.banners[0]).toMatchObject({ title: "Weekend deals", isActive: true });

    const publicHome = await request(app).get("/api/v1/homepage").expect(200);
    expect(publicHome.body.data.content).toMatchObject({ heroTitle: "Updated UK-used deals", promoSubtitle: "Admin picks" });
    expect(publicHome.body.data.featuredProducts.length).toBeGreaterThan(0);

    const log = await AdminActivityLog.findOne({ action: "homepage_content.updated" }).lean();
    expect(log.details).toMatchObject({ bannerCount: 1 });
  });
  it("allows admins to manage catalogue categories, brands and condition grades", async () => {
    const cookies = await createAdminCookies();

    const category = await request(app)
      .post("/api/v1/admin/categories")
      .set("Cookie", cookies)
      .send({ name: "Tablets", description: "UK-used tablets and iPads." })
      .expect(201);
    expect(category.body.data.category).toMatchObject({ name: "Tablets", slug: "tablets", isActive: true });

    const brand = await request(app)
      .post("/api/v1/admin/brands")
      .set("Cookie", cookies)
      .send({ name: "Samsung", description: "Samsung UK-used devices." })
      .expect(201);
    expect(brand.body.data.brand).toMatchObject({ name: "Samsung", slug: "samsung", isActive: true });

    const grade = await request(app)
      .post("/api/v1/admin/condition-grades")
      .set("Cookie", cookies)
      .send({ code: "VERY-GOOD", name: "Very Good", description: "Minor signs of use.", sortOrder: 2 })
      .expect(201);
    expect(grade.body.data.conditionGrade).toMatchObject({ code: "very-good", name: "Very Good", isActive: true });

    await request(app)
      .patch(`/api/v1/admin/categories/${category.body.data.category.id}`)
      .set("Cookie", cookies)
      .send({ isActive: false })
      .expect(200);
    await request(app)
      .patch(`/api/v1/admin/brands/${brand.body.data.brand.id}`)
      .set("Cookie", cookies)
      .send({ isActive: false })
      .expect(200);
    await request(app)
      .patch(`/api/v1/admin/condition-grades/${grade.body.data.conditionGrade.id}`)
      .set("Cookie", cookies)
      .send({ isActive: false })
      .expect(200);

    const lookups = await request(app).get("/api/v1/admin/catalogue-lookups").set("Cookie", cookies).expect(200);
    expect(lookups.body.data.categories[0]).toMatchObject({ name: "Tablets", isActive: false });
    expect(lookups.body.data.brands[0]).toMatchObject({ name: "Samsung", isActive: false });
    expect(lookups.body.data.conditionGrades[0]).toMatchObject({ name: "Very Good", isActive: false });

    const log = await AdminActivityLog.findOne({ action: "condition_grade.updated" }).lean();
    expect(log.details).toMatchObject({ code: "very-good", isActive: false });
  });
  it("allows admins to upload and manage product images", async () => {
    const cookies = await createAdminCookies();
    const { product } = await seedProduct();
    const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lX3K0wAAAABJRU5ErkJggg==";

    const upload = await request(app)
      .post("/api/v1/admin/uploads/product-image")
      .set("Cookie", cookies)
      .send({ dataUri: tinyPng, altText: "Actual iPhone back panel" })
      .expect(201);

    expect(upload.body.data.image).toMatchObject({ altText: "Actual iPhone back panel" });
    expect(upload.body.data.image.cloudinaryPublicId).toContain("just-adure/products/demo-");

    const attach = await request(app)
      .post(`/api/v1/admin/products/${String(product._id)}/images`)
      .set("Cookie", cookies)
      .send({ ...upload.body.data.image, isPrimary: true })
      .expect(200);

    expect(attach.body.data.product.images.some((image) => image.cloudinaryPublicId === upload.body.data.image.cloudinaryPublicId)).toBe(true);
    expect(attach.body.data.product.images.find((image) => image.cloudinaryPublicId === upload.body.data.image.cloudinaryPublicId).isPrimary).toBe(true);

    const originalImageId = product.images[0].cloudinaryPublicId;
    const primary = await request(app)
      .patch(`/api/v1/admin/products/${String(product._id)}/images/${encodeURIComponent(originalImageId)}/primary`)
      .set("Cookie", cookies)
      .expect(200);

    expect(primary.body.data.product.images.find((image) => image.cloudinaryPublicId === originalImageId).isPrimary).toBe(true);

    const removed = await request(app)
      .delete(`/api/v1/admin/products/${String(product._id)}/images/${encodeURIComponent(upload.body.data.image.cloudinaryPublicId)}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(removed.body.data.product.images.some((image) => image.cloudinaryPublicId === upload.body.data.image.cloudinaryPublicId)).toBe(false);

    const log = await AdminActivityLog.findOne({ action: "product_image.removed" }).lean();
    expect(log.details).toMatchObject({ sku: "JAN-PHN-001", cloudinaryPublicId: upload.body.data.image.cloudinaryPublicId });
  });
  it("allows admins to manage delivery zones used by checkout", async () => {
    const cookies = await createAdminCookies("order_manager", "delivery-manager@example.com");

    const create = await request(app)
      .post("/api/v1/admin/delivery-zones")
      .set("Cookie", cookies)
      .send({
        code: "lag-main",
        name: "Lagos Mainland",
        state: "Lagos",
        cityPattern: "Ikeja|Yaba|Surulere",
        feeKobo: 4_500_00,
        minDeliveryDays: 1,
        maxDeliveryDays: 3,
        priority: 5,
      })
      .expect(201);

    expect(create.body.data.zone).toMatchObject({ code: "LAG-MAIN", state: "Lagos", feeKobo: 4_500_00, isActive: true });

    const list = await request(app).get("/api/v1/admin/delivery-zones").set("Cookie", cookies).expect(200);
    expect(list.body.data.items).toHaveLength(1);

    const quote = await request(app)
      .post("/api/v1/checkout/delivery-fee")
      .send({ state: "Lagos", city: "Ikeja", deliveryMethod: "delivery" })
      .expect(200);
    expect(quote.body.data).toMatchObject({ deliveryFeeKobo: 4_500_00, zone: { name: "Lagos Mainland" } });

    const update = await request(app)
      .patch(`/api/v1/admin/delivery-zones/${create.body.data.zone.id}`)
      .set("Cookie", cookies)
      .send({ feeKobo: 6_000_00, isActive: false, minDeliveryDays: 2, maxDeliveryDays: 4 })
      .expect(200);

    expect(update.body.data.zone).toMatchObject({ feeKobo: 6_000_00, isActive: false, minDeliveryDays: 2, maxDeliveryDays: 4 });

    await request(app)
      .post("/api/v1/checkout/delivery-fee")
      .send({ state: "Lagos", city: "Ikeja", deliveryMethod: "delivery" })
      .expect(400);

    const log = await AdminActivityLog.findOne({ action: "delivery_zone.updated" }).lean();
    expect(log.details).toMatchObject({ code: "LAG-MAIN", feeKobo: 6_000_00, isActive: false });
  });
  it("allows admins to manage newsletter subscribers", async () => {
    const cookies = await createAdminCookies();
    const subscriber = await NewsletterSubscriber.create({
      email: "newsletter@example.com",
      name: "Newsletter Buyer",
      source: "footer",
      status: "subscribed",
    });
    await NewsletterSubscriber.create({
      email: "paused@example.com",
      name: "Paused Buyer",
      source: "homepage",
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    });

    const list = await request(app).get("/api/v1/admin/newsletter-subscribers").set("Cookie", cookies).expect(200);
    expect(list.body.data.summary).toMatchObject({ total: 2, subscribed: 1, unsubscribed: 1 });
    expect(list.body.data.items[0]).toHaveProperty("email");

    const filtered = await request(app).get("/api/v1/admin/newsletter-subscribers?status=subscribed").set("Cookie", cookies).expect(200);
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0]).toMatchObject({ email: "newsletter@example.com", status: "subscribed" });

    const updated = await request(app)
      .patch(`/api/v1/admin/newsletter-subscribers/${String(subscriber._id)}`)
      .set("Cookie", cookies)
      .send({ status: "unsubscribed" })
      .expect(200);

    expect(updated.body.data.subscriber).toMatchObject({ email: "newsletter@example.com", status: "unsubscribed" });
    expect(updated.body.data.subscriber.unsubscribedAt).toBeTruthy();

    const log = await AdminActivityLog.findOne({ action: "newsletter_subscriber.updated" }).lean();
    expect(log.details).toMatchObject({ email: "newsletter@example.com", status: "unsubscribed" });
  });});





