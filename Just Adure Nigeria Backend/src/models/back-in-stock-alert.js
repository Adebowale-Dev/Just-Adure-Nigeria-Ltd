import mongoose from "mongoose";
const { Schema } = mongoose;

export const backInStockAlertStatuses = ["active", "notified", "cancelled"];

const backInStockAlertSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
  email: { type: String, required: true, trim: true, lowercase: true },
  status: { type: String, required: true, enum: backInStockAlertStatuses, default: "active" },
  notifiedAt: { type: Date },
}, { timestamps: true });

backInStockAlertSchema.index({ userId: 1, productId: 1, status: 1 });
backInStockAlertSchema.index({ productId: 1, status: 1 });
backInStockAlertSchema.index({ email: 1, status: 1 });

export const BackInStockAlert = mongoose.models.BackInStockAlert || mongoose.model("BackInStockAlert", backInStockAlertSchema);