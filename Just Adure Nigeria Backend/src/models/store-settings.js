import mongoose from "mongoose";

const { Schema } = mongoose;

const socialLinksSchema = new Schema(
  {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    x: { type: String, trim: true },
    tiktok: { type: String, trim: true },
  },
  { _id: false },
);

const storeSettingsSchema = new Schema(
  {
    singletonKey: { type: String, required: true, default: "store-settings", unique: true },
    storeName: { type: String, required: true, trim: true, default: "Just Adure Nigeria Ltd" },
    logoUrl: { type: String, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true, default: "hello@justadure.ng" },
    phoneNumber: { type: String, required: true, trim: true, default: "08000000000" },
    whatsappNumber: { type: String, required: true, trim: true, default: "08000000000" },
    storeAddress: { type: String, required: true, trim: true, default: "Lagos, Nigeria" },
    socialLinks: { type: socialLinksSchema, required: true, default: {} },
    defaultCurrency: { type: String, required: true, trim: true, uppercase: true, default: "NGN" },
    taxRatePercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
    defaultDeliveryInformation: { type: String, required: true, trim: true, default: "Delivery fees are calculated during checkout based on your location." },
    returnPeriodDays: { type: Number, required: true, min: 0, default: 7 },
    warrantyInformation: { type: String, required: true, trim: true, default: "Warranty details are shown on each product page." },
    maintenanceMode: { type: Boolean, required: true, default: false },
    maintenanceMessage: { type: String, trim: true, default: "We are currently updating the store. Please check back soon." },
  },
  { timestamps: true },
);

export const StoreSettings = mongoose.models.StoreSettings || mongoose.model("StoreSettings", storeSettingsSchema);