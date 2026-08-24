import mongoose from "mongoose";

const { Schema } = mongoose;

export const couponTypes = ["fixed", "percentage"];

const couponSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, required: true, enum: couponTypes },
    valueKobo: { type: Number, min: 0 },
    percentage: { type: Number, min: 1, max: 100 },
    minOrderAmountKobo: { type: Number, required: true, min: 0, default: 0 },
    maxDiscountKobo: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 1 },
    usageLimitPerCustomer: { type: Number, min: 1 },
    usedCount: { type: Number, required: true, min: 0, default: 0 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, required: true, default: true },
    firstOrderOnly: { type: Boolean, required: true, default: false },
    productIds: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
    categoryIds: { type: [Schema.Types.ObjectId], ref: "Category", default: [] },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });

couponSchema.pre("validate", function validateCouponValue() {
  if (this.type === "fixed" && !Number.isFinite(this.valueKobo)) {
    throw new Error("Fixed coupons require valueKobo.");
  }
  if (this.type === "percentage" && !Number.isFinite(this.percentage)) {
    throw new Error("Percentage coupons require percentage.");
  }
});
export const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);