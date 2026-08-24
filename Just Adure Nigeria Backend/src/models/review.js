import mongoose from "mongoose";

const { Schema } = mongoose;

export const reviewStatuses = ["pending", "approved", "rejected", "hidden"];

const reviewSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    imageUrl: { type: String, trim: true },
    status: { type: String, required: true, enum: reviewStatuses, default: "pending" },
    isVerifiedPurchase: { type: Boolean, required: true, default: false },
    adminReply: { type: String, trim: true, maxlength: 1000 },
    moderatedAt: { type: Date },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ customerEmail: 1, productId: 1 });

export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);