import mongoose from "mongoose";

const { Schema } = mongoose;

const homepageBannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    ctaLabel: { type: String, required: true, trim: true, default: "Shop now" },
    ctaHref: { type: String, required: true, trim: true, default: "/shop" },
    isActive: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { _id: true },
);

const homepageContentSchema = new Schema(
  {
    singletonKey: { type: String, required: true, default: "homepage-content", unique: true },
    heroEyebrow: { type: String, required: true, trim: true, default: "Tested in Nigeria. Sourced from the UK." },
    heroTitle: { type: String, required: true, trim: true, default: "Pre-owned tech, properly checked." },
    heroSubtitle: { type: String, required: true, trim: true, default: "Actual photos, honest condition notes, and devices tested before they reach your door." },
    heroPrimaryCtaLabel: { type: String, required: true, trim: true, default: "Shop latest arrivals" },
    heroPrimaryCtaHref: { type: String, required: true, trim: true, default: "/shop" },
    heroSecondaryCtaLabel: { type: String, required: true, trim: true, default: "How we test products" },
    heroSecondaryCtaHref: { type: String, required: true, trim: true, default: "/about" },
    promoTitle: { type: String, required: true, trim: true, default: "Fresh from the test bench" },
    promoSubtitle: { type: String, required: true, trim: true, default: "Featured finds" },
    trustTitle: { type: String, required: true, trim: true, default: "Trust is in the details." },
    trustSubtitle: { type: String, required: true, trim: true, default: "Buy the exact item you inspected" },
    banners: { type: [homepageBannerSchema], required: true, default: [] },
  },
  { timestamps: true },
);

export const HomepageContent = mongoose.models.HomepageContent || mongoose.model("HomepageContent", homepageContentSchema);