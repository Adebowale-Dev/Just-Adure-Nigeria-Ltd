import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Cart } from "../src/models/cart.js";
import { Brand, Category, ConditionGrade, Product } from "../src/models/catalogue.js";
function normalizeCookies(cookieHeader) {
    if (!cookieHeader) {
        return [];
    }
    return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}
async function clearCollections() {
    await Promise.all([
        Cart.deleteMany({}),
        Product.deleteMany({}),
        Brand.deleteMany({}),
        Category.deleteMany({}),
        ConditionGrade.deleteMany({}),
    ]);
}
async function seedCartProduct(stockQuantity = 2) {
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
describe("cart API", () => {
    it("creates a guest cart and adds a product using backend-calculated totals", async () => {
        const product = await seedCartProduct();
        const response = await request(app)
            .post("/api/v1/cart/items")
            .send({ productId: String(product._id), quantity: 2 })
            .expect(200);
        expect(normalizeCookies(response.headers["set-cookie"]).join(";")).toContain("ja_cart_id");
        expect(response.body.data.cart).toMatchObject({
            currency: "NGN",
            itemCount: 2,
            subtotalKobo: 1_350_000_00,
            totalKobo: 1_350_000_00,
        });
        expect(response.body.data.cart.items[0]).toMatchObject({
            productId: String(product._id),
            quantity: 2,
            unitPriceKobo: 675_000_00,
            lineSubtotalKobo: 1_350_000_00,
        });
    });
    it("prevents customers from adding more units than available", async () => {
        const product = await seedCartProduct(1);
        const response = await request(app)
            .post("/api/v1/cart/items")
            .send({ productId: String(product._id), quantity: 2 })
            .expect(409);
        expect(response.body.error.code).toBe("INSUFFICIENT_STOCK");
    });
    it("updates and removes cart item quantities", async () => {
        const product = await seedCartProduct();
        const add = await request(app)
            .post("/api/v1/cart/items")
            .send({ slug: product.slug, quantity: 1 })
            .expect(200);
        const cookies = normalizeCookies(add.headers["set-cookie"]);
        const updated = await request(app)
            .patch(`/api/v1/cart/items/${String(product._id)}`)
            .set("Cookie", cookies)
            .send({ quantity: 2 })
            .expect(200);
        expect(updated.body.data.cart.itemCount).toBe(2);
        const removed = await request(app)
            .delete(`/api/v1/cart/items/${String(product._id)}`)
            .set("Cookie", cookies)
            .expect(200);
        expect(removed.body.data.cart.itemCount).toBe(0);
    });
    it("clears the current cart", async () => {
        const product = await seedCartProduct();
        const add = await request(app)
            .post("/api/v1/cart/items")
            .send({ slug: product.slug, quantity: 1 })
            .expect(200);
        const cleared = await request(app).delete("/api/v1/cart").set("Cookie", normalizeCookies(add.headers["set-cookie"])).expect(200);
        expect(cleared.body.data.cart).toMatchObject({ itemCount: 0, subtotalKobo: 0, totalKobo: 0 });
    });
});
