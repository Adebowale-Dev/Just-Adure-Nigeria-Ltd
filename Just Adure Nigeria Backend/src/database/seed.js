import { connectMongo, disconnectMongo } from "../config/mongo.js";
import { Brand, Category, ConditionGrade, DeliveryZone, Product, } from "../models/catalogue.js";
const conditionGrades = [
    {
        code: "like_new",
        name: "Like New",
        description: "Minimal signs of use and exceptionally clean overall.",
        sortOrder: 1,
    },
    {
        code: "excellent",
        name: "Excellent",
        description: "Light cosmetic wear with no effect on normal operation.",
        sortOrder: 2,
    },
    {
        code: "good",
        name: "Good",
        description: "Visible everyday wear, fully tested and working as described.",
        sortOrder: 3,
    },
    {
        code: "fair",
        name: "Fair",
        description: "Noticeable cosmetic wear or disclosed defects, priced accordingly.",
        sortOrder: 4,
    },
];
const deliveryZones = [
    {
        code: "lagos-mainland",
        name: "Lagos Mainland",
        state: "Lagos",
        cityPattern: "Ikeja|Yaba|Surulere|Gbagada|Maryland",
        feeKobo: 7_500_00,
        minDeliveryDays: 1,
        maxDeliveryDays: 2,
        priority: 20,
    },
    {
        code: "lagos-state",
        name: "Lagos State",
        state: "Lagos",
        feeKobo: 12_000_00,
        minDeliveryDays: 1,
        maxDeliveryDays: 3,
        priority: 10,
    },
    {
        code: "abuja-fct",
        name: "Abuja FCT",
        state: "Federal Capital Territory",
        feeKobo: 18_000_00,
        minDeliveryDays: 2,
        maxDeliveryDays: 4,
        priority: 10,
    },
];
const catalogue = [
    {
        name: "Apple iPhone 13 Pro 256GB",
        slug: "apple-iphone-13-pro-256gb-sierra-blue",
        sku: "UKU-APL-IP13P-256-SB-001",
        brand: "Apple",
        brandSlug: "apple",
        category: "Phones",
        categorySlug: "phones",
        condition: "excellent",
        priceKobo: 675_000_00,
        previousPriceKobo: 715_000_00,
        stockQuantity: 1,
        shortDescription: "Unlocked UK-used iPhone with strong battery health and original display.",
        description: "Fully tested iPhone 13 Pro with Face ID, cameras, speakers, charging, and network functions working correctly.",
        visibleDefects: "Two faint marks on the stainless-steel frame; screen is clean.",
        includedAccessories: "USB-C to Lightning cable and protective case.",
        warrantyInformation: "30-day functional warranty.",
        colour: "Sierra Blue",
        modelNumber: "A2638",
        featured: true,
        imageUrl: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=1200&q=85",
        specs: {
            Storage: "256GB",
            Display: "6.1-inch Super Retina XDR",
            Network: "Unlocked 5G",
            "Battery health": "88%",
        },
    },
    {
        name: "Dell Latitude 7420 Core i7",
        slug: "dell-latitude-7420-core-i7-16gb-512gb",
        sku: "UKU-DELL-7420-I7-001",
        brand: "Dell",
        brandSlug: "dell",
        category: "Laptops",
        categorySlug: "laptops",
        condition: "good",
        priceKobo: 585_000_00,
        previousPriceKobo: null,
        stockQuantity: 2,
        shortDescription: "Business-grade 14-inch laptop with 11th-gen Core i7 and fast SSD.",
        description: "A dependable UK-used Latitude tested for keyboard, ports, Wi-Fi, webcam, battery, display, and storage health.",
        visibleDefects: "Light lid scratches and minor palm-rest shine from normal use.",
        includedAccessories: "Original Dell 65W USB-C charger.",
        warrantyInformation: "60-day functional warranty.",
        colour: "Black",
        modelNumber: "Latitude 7420",
        featured: true,
        imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85",
        specs: {
            Processor: "Intel Core i7-1185G7",
            Memory: "16GB DDR4",
            Storage: "512GB NVMe SSD",
            Display: "14-inch Full HD",
        },
    },
    {
        name: "Samsung 50-inch Crystal UHD 4K TV",
        slug: "samsung-50-inch-crystal-uhd-4k-smart-tv",
        sku: "UKU-SAM-TV50-CU-001",
        brand: "Samsung",
        brandSlug: "samsung",
        category: "Televisions",
        categorySlug: "televisions",
        condition: "excellent",
        priceKobo: 445_000_00,
        previousPriceKobo: 475_000_00,
        stockQuantity: 1,
        shortDescription: "Slim 4K smart television with tested Wi-Fi, HDMI, speakers, and panel.",
        description: "The panel has been checked for dead pixels, lines, discolouration, and backlight issues.",
        visibleDefects: "A small mark on the rear casing; not visible from the front.",
        includedAccessories: "Remote control, table stand, and power cable.",
        warrantyInformation: "30-day functional warranty; screen impact is excluded.",
        colour: "Black",
        modelNumber: "UE50CU7100",
        featured: true,
        imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=85",
        specs: {
            Resolution: "3840 x 2160 (4K UHD)",
            Connectivity: "Wi-Fi, Bluetooth, HDMI, USB",
            Platform: "Samsung Smart TV",
            Screen: "50 inches",
        },
    },
    {
        name: "Sony PlayStation 5 Disc Edition",
        slug: "sony-playstation-5-disc-edition",
        sku: "UKU-SNY-PS5-DISC-001",
        brand: "Sony",
        brandSlug: "sony",
        category: "Game Consoles",
        categorySlug: "game-consoles",
        condition: "good",
        priceKobo: 650_000_00,
        previousPriceKobo: null,
        stockQuantity: 1,
        shortDescription: "Tested PS5 disc console with DualSense controller and required cables.",
        description: "Console has passed disc-drive, network, HDMI, controller, storage, and sustained gameplay tests.",
        visibleDefects: "Fine surface marks on the white side plates.",
        includedAccessories: "One DualSense controller, HDMI cable, power cable, and USB charging cable.",
        warrantyInformation: "30-day functional warranty.",
        colour: "White",
        modelNumber: "CFI-1116A",
        featured: false,
        imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=85",
        specs: {
            Storage: "825GB SSD",
            Edition: "Disc",
            Resolution: "Up to 4K",
            Controller: "1 x DualSense",
        },
    },
    {
        name: "LG 260L Frost-Free Fridge Freezer",
        slug: "lg-260l-frost-free-fridge-freezer",
        sku: "UKU-LG-FRG-260-001",
        brand: "LG",
        brandSlug: "lg",
        category: "Refrigerators",
        categorySlug: "refrigerators",
        condition: "fair",
        priceKobo: 390_000_00,
        previousPriceKobo: 430_000_00,
        stockQuantity: 1,
        shortDescription: "Energy-efficient fridge freezer tested for stable cooling and quiet operation.",
        description: "The appliance completed an extended cooling test. Thermostat, light, seals, shelves, freezer, and compressor operate correctly.",
        visibleDefects: "Several shallow dents on the right side and light handle wear.",
        includedAccessories: "Three glass shelves, vegetable drawer, and ice tray.",
        warrantyInformation: "30-day functional warranty. Delivery inspection required.",
        colour: "Silver",
        modelNumber: "GBB329DSJZ",
        featured: false,
        imageUrl: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1200&q=85",
        specs: {
            Capacity: "260 litres",
            Cooling: "Frost free",
            Layout: "Bottom freezer",
            Voltage: "220-240V",
        },
    },
    {
        name: "Anker 735 GaNPrime 65W Charger",
        slug: "anker-735-ganprime-65w-charger",
        sku: "UKU-ANK-735-65W-001",
        brand: "Anker",
        brandSlug: "anker",
        category: "Accessories",
        categorySlug: "accessories",
        condition: "like_new",
        priceKobo: 49_500_00,
        previousPriceKobo: 55_000_00,
        stockQuantity: 4,
        shortDescription: "Compact three-port USB-C/USB-A fast charger for phones and laptops.",
        description: "All ports have been load-tested. The charger supports dynamic output sharing for compatible phones, tablets, and laptops.",
        visibleDefects: "No notable cosmetic defects.",
        includedAccessories: "UK three-pin plug attachment.",
        warrantyInformation: "30-day functional warranty.",
        colour: "Black",
        modelNumber: "A2668",
        featured: false,
        imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=85",
        specs: {
            Output: "65W maximum",
            Ports: "2 x USB-C, 1 x USB-A",
            Technology: "GaNPrime",
            Plug: "UK three-pin",
        },
    },
];
async function upsertConditionGrades() {
    const gradeByCode = new Map();
    for (const grade of conditionGrades) {
        const record = await ConditionGrade.findOneAndUpdate({ code: grade.code }, { $set: { ...grade, isActive: true } }, { returnDocument: "after", upsert: true, runValidators: true }).orFail();
        gradeByCode.set(record.code, record);
    }
    return gradeByCode;
}
async function upsertDeliveryZones() {
    for (const zone of deliveryZones) {
        await DeliveryZone.findOneAndUpdate({ code: zone.code }, { $set: { ...zone, isActive: true } }, { returnDocument: "after", upsert: true, runValidators: true });
    }
}
async function upsertCatalogue(gradeByCode) {
    for (const item of catalogue) {
        const brand = (await Brand.findOneAndUpdate({ slug: item.brandSlug }, { $set: { name: item.brand, slug: item.brandSlug, isActive: true } }, { returnDocument: "after", upsert: true, runValidators: true }).orFail());
        const category = (await Category.findOneAndUpdate({ slug: item.categorySlug }, {
            $set: {
                name: item.category,
                slug: item.categorySlug,
                description: `Carefully tested UK-used ${item.category.toLowerCase()}.`,
                isActive: true,
            },
        }, { returnDocument: "after", upsert: true, runValidators: true }).orFail());
        const conditionGrade = gradeByCode.get(item.condition);
        if (!conditionGrade) {
            throw new Error(`Missing condition grade for ${item.condition}`);
        }
        await Product.findOneAndUpdate({ sku: item.sku }, {
            $set: {
                name: item.name,
                slug: item.slug,
                sku: item.sku,
                brandId: brand._id,
                categoryId: category._id,
                conditionGradeId: conditionGrade._id,
                priceKobo: item.priceKobo,
                previousPriceKobo: item.previousPriceKobo,
                stockQuantity: item.stockQuantity,
                reservedQuantity: 0,
                lowStockThreshold: 1,
                shortDescription: item.shortDescription,
                description: item.description,
                visibleDefects: item.visibleDefects,
                includedAccessories: item.includedAccessories,
                warrantyInformation: item.warrantyInformation,
                colour: item.colour,
                modelNumber: item.modelNumber,
                availability: "in_stock",
                isFeatured: item.featured,
                isArchived: false,
                seoTitle: `${item.name} | Just Adure Nigeria Ltd`,
                seoDescription: item.shortDescription,
                images: [
                    {
                        cloudinaryPublicId: `demo/${item.slug}`,
                        secureUrl: item.imageUrl,
                        altText: `${item.name} demonstration product photograph`,
                        sortOrder: 0,
                        isPrimary: true,
                    },
                ],
                specifications: Object.entries(item.specs).map(([label, value], index) => ({
                    groupName: "Key specifications",
                    label,
                    value,
                    sortOrder: index,
                })),
            },
        }, { returnDocument: "after", upsert: true, runValidators: true });
    }
}
async function main() {
    await connectMongo(true);
    const gradeByCode = await upsertConditionGrades();
    await upsertDeliveryZones();
    await upsertCatalogue(gradeByCode);
    console.info(`Seeded ${catalogue.length} MongoDB demonstration products.`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await disconnectMongo();
});
