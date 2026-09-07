import mongoose from "mongoose";
const { Schema } = mongoose;
export const productAvailability = [
    "in_stock",
    "low_stock",
    "out_of_stock",
    "archived",
];
const conditionGradeSchema = new Schema({
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true });
const brandSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true });
const categorySchema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    isActive: { type: Boolean, required: true, default: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category" },
}, { timestamps: true });
const productImageSchema = new Schema({
    cloudinaryPublicId: { type: String, required: true, trim: true },
    secureUrl: { type: String, required: true, trim: true },
    width: { type: Number },
    height: { type: Number },
    altText: { type: String, required: true, trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
    isPrimary: { type: Boolean, required: true, default: false },
}, { _id: false });
const productSpecificationSchema = new Schema({
    groupName: { type: String, trim: true },
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
}, { _id: false });
const productSchema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    brandId: { type: Schema.Types.ObjectId, required: true, ref: "Brand" },
    categoryId: { type: Schema.Types.ObjectId, required: true, ref: "Category" },
    productType: { type: String, enum: ["used", "brand_new"], required: true, default: "used" },
    conditionGradeId: {
        type: Schema.Types.ObjectId,
        ref: "ConditionGrade",
    },
    priceKobo: { type: Number, required: true, min: 0 },
    previousPriceKobo: { type: Number, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    reservedQuantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 1 },
    shortDescription: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    visibleDefects: { type: String, trim: true },
    includedAccessories: { type: String, trim: true },
    warrantyInformation: { type: String, trim: true },
    colour: { type: String, trim: true },
    modelNumber: { type: String, trim: true },
    availability: {
        type: String,
        required: true,
        enum: productAvailability,
        default: "in_stock",
    },
    isFeatured: { type: Boolean, required: true, default: false },
    isArchived: { type: Boolean, required: true, default: false },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    images: { type: [productImageSchema], required: true, default: [] },
    specifications: {
        type: [productSpecificationSchema],
        required: true,
        default: [],
    },
}, { timestamps: true });
const deliveryZoneSchema = new Schema({
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    cityPattern: { type: String, trim: true },
    feeKobo: { type: Number, required: true, min: 0 },
    minDeliveryDays: { type: Number, required: true, min: 1 },
    maxDeliveryDays: { type: Number, required: true, min: 1 },
    priority: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true });
conditionGradeSchema.index({ isActive: 1, sortOrder: 1 });
brandSchema.index({ isActive: 1, name: 1 });
categorySchema.index({ parentId: 1, isActive: 1 });
productSchema.index({ categoryId: 1, availability: 1, isArchived: 1 });
productSchema.index({ brandId: 1, availability: 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ priceKobo: 1 });
deliveryZoneSchema.index({ state: 1, isActive: 1, priority: -1 });
export const ConditionGrade = mongoose.models.ConditionGrade ||
    mongoose.model("ConditionGrade", conditionGradeSchema);
export const Brand = mongoose.models.Brand ||
    mongoose.model("Brand", brandSchema);
export const Category = mongoose.models.Category ||
    mongoose.model("Category", categorySchema);
export const Product = mongoose.models.Product ||
    mongoose.model("Product", productSchema);
export const DeliveryZone = mongoose.models.DeliveryZone ||
    mongoose.model("DeliveryZone", deliveryZoneSchema);
