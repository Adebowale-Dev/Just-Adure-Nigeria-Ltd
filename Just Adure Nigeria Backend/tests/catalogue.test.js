import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Brand, Category, ConditionGrade, Product } from "../src/models/catalogue.js";
async function clearCatalogueCollections() {
    await Promise.all([
        Product.deleteMany({}),
        Brand.deleteMany({}),
        Category.deleteMany({}),
        ConditionGrade.deleteMany({}),
    ]);
}
function requireSeedRecord(record, label) {
    if (!record) {
        throw new Error(`Missing seed record: ${label}`);
    }
    return record;
}
async function seedCatalogue() {
    const conditionGrades = await ConditionGrade.create([
        {
            code: "excellent",
            name: "Excellent",
            description: "Very clean UK-used product with minimal signs of use.",
            sortOrder: 2,
        },
        {
            code: "good",
            name: "Good",
            description: "Fully tested with visible signs of previous use.",
            sortOrder: 4,
        },
    ]);
    const brands = await Brand.create([
        { name: "Apple", slug: "apple", description: "Apple UK-used devices" },
        { name: "Dell", slug: "dell", description: "Dell UK-used laptops" },
    ]);
    const categories = await Category.create([
        { name: "Phones", slug: "phones", description: "UK-used phones" },
        { name: "Laptops", slug: "laptops", description: "UK-used laptops" },
    ]);
    const excellent = requireSeedRecord(conditionGrades[0], "excellent condition grade");
    const good = requireSeedRecord(conditionGrades[1], "good condition grade");
    const apple = requireSeedRecord(brands[0], "apple brand");
    const dell = requireSeedRecord(brands[1], "dell brand");
    const phones = requireSeedRecord(categories[0], "phones category");
    const laptops = requireSeedRecord(categories[1], "laptops category");
    await Product.create([
        {
            name: "iPhone 13 Pro 256GB",
            slug: "iphone-13-pro-256gb",
            sku: "JAN-PHN-001",
            brandId: apple._id,
            categoryId: phones._id,
            conditionGradeId: excellent._id,
            priceKobo: 675_000_00,
            previousPriceKobo: 715_000_00,
            stockQuantity: 1,
            reservedQuantity: 0,
            shortDescription: "Unlocked UK-used iPhone with strong battery health.",
            description: "A tested UK-used iPhone with actual condition notes.",
            visibleDefects: "Two faint frame marks.",
            includedAccessories: "USB-C cable only.",
            warrantyInformation: "30-day limited warranty.",
            colour: "Sierra Blue",
            modelNumber: "A2638",
            availability: "in_stock",
            isFeatured: true,
            images: [
                {
                    cloudinaryPublicId: "demo/iphone",
                    secureUrl: "https://example.com/iphone.jpg",
                    altText: "iPhone 13 Pro actual unit",
                    isPrimary: true,
                },
            ],
            specifications: [{ label: "Storage", value: "256GB" }],
        },
        {
            name: "Dell Latitude 7420",
            slug: "dell-latitude-7420",
            sku: "JAN-LAP-001",
            brandId: dell._id,
            categoryId: laptops._id,
            conditionGradeId: good._id,
            priceKobo: 585_000_00,
            stockQuantity: 3,
            reservedQuantity: 1,
            shortDescription: "Business laptop tested for keyboard, ports and battery.",
            description: "A dependable UK-used Dell Latitude laptop.",
            visibleDefects: "Light lid scratches.",
            includedAccessories: "Charger included.",
            warrantyInformation: "14-day limited warranty.",
            colour: "Silver",
            modelNumber: "7420",
            availability: "in_stock",
            images: [
                {
                    cloudinaryPublicId: "demo/dell",
                    secureUrl: "https://example.com/dell.jpg",
                    altText: "Dell Latitude actual unit",
                    isPrimary: true,
                },
            ],
            specifications: [{ label: "RAM", value: "16GB" }],
            vehicleDetails: {
                year: 2018,
                mileageKm: 84000,
                transmission: "automatic",
                fuelType: "petrol",
                bodyType: "Saloon",
                engine: "2.0L",
                drivetrain: "FWD",
                location: "Ikeja, Lagos",
            },
        },
    ]);
}
beforeAll(async () => {
    await connectMongo(true);
});
beforeEach(async () => {
    await clearCatalogueCollections();
    await seedCatalogue();
});
afterAll(async () => {
    await clearCatalogueCollections();
    await disconnectMongo();
});
describe("catalogue API", () => {
    it("lists products with pagination metadata and NGN pricing", async () => {
        const response = await request(app).get("/api/v1/products?limit=1&page=1").expect(200);
        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.items[0]).toMatchObject({ currency: "NGN" });
        expect(response.body.data.meta).toMatchObject({ page: 1, limit: 1, totalItems: 2, totalPages: 2 });
    });
    it("searches products by name and filters by brand, category and condition", async () => {
        const response = await request(app)
            .get("/api/v1/products?q=iphone&brand=apple&category=phones&condition=excellent")
            .expect(200);
        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.items[0]).toMatchObject({
            slug: "iphone-13-pro-256gb",
            brand: { slug: "apple" },
            category: { slug: "phones" },
            conditionGrade: { code: "excellent" },
        });
    });
    it("returns product details by slug with honest condition and stock information", async () => {
        const response = await request(app).get("/api/v1/products/dell-latitude-7420").expect(200);
        expect(response.body.data.product).toMatchObject({
            slug: "dell-latitude-7420",
            availableQuantity: 2,
            isSoldOut: false,
            visibleDefects: "Light lid scratches.",
            includedAccessories: "Charger included.",
            warrantyInformation: "14-day limited warranty.",
            vehicleDetails: {
                year: 2018,
                mileageKm: 84000,
                transmission: "automatic",
                fuelType: "petrol",
                bodyType: "Saloon",
                location: "Ikeja, Lagos",
            },
        });
    });
    it("filters and returns structured vehicle details", async () => {
        const response = await request(app)
            .get("/api/v1/products?transmission=automatic&fuelType=petrol&minYear=2017&maxYear=2019")
            .expect(200);
        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.items[0]).toMatchObject({
            slug: "dell-latitude-7420",
            vehicleDetails: { year: 2018, mileageKm: 84000, transmission: "automatic" },
        });
    });
    it("returns lookup data for storefront filters", async () => {
        const [categories, brands, grades] = await Promise.all([
            request(app).get("/api/v1/categories").expect(200),
            request(app).get("/api/v1/brands").expect(200),
            request(app).get("/api/v1/condition-grades").expect(200),
        ]);
        expect(categories.body.data.items.map((category) => category.slug)).toContain("phones");
        expect(brands.body.data.items.map((brand) => brand.slug)).toContain("apple");
        expect(grades.body.data.items.map((grade) => grade.code)).toContain("excellent");
    });
    it("returns only brands and conditions used by the selected category", async () => {
        const response = await request(app).get("/api/v1/catalogue-options?category=laptops").expect(200);
        expect(response.body.data.brands.map((brand) => brand.slug)).toEqual(["dell"]);
        expect(response.body.data.conditionGrades.map((grade) => grade.code)).toEqual(["good"]);
    });
    it("returns a safe error when a product slug does not exist", async () => {
        const response = await request(app).get("/api/v1/products/not-real").expect(404);
        expect(response.body.error.code).toBe("PRODUCT_NOT_FOUND");
    });
});
