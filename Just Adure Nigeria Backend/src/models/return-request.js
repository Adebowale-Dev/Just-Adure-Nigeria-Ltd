import mongoose from "mongoose";

const { Schema } = mongoose;

export const returnRequestStatuses = ["requested", "under_review", "approved", "rejected", "refunded", "closed"];
export const returnReasons = ["wrong_item", "not_as_described", "damaged", "defective", "changed_mind", "other"];

const returnItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const returnRequestSchema = new Schema(
  {
    requestNumber: { type: String, required: true, trim: true, unique: true },
    orderId: { type: Schema.Types.ObjectId, required: true, ref: "Order" },
    orderNumber: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    reason: { type: String, required: true, enum: returnReasons },
    details: { type: String, required: true, trim: true, maxlength: 1000 },
    items: { type: [returnItemSchema], required: true, default: [] },
    status: { type: String, required: true, enum: returnRequestStatuses, default: "requested" },
    adminNote: { type: String, trim: true, maxlength: 1000 },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

returnRequestSchema.index({ orderId: 1, status: 1 });
returnRequestSchema.index({ customerEmail: 1, createdAt: -1 });

export const ReturnRequest = mongoose.models.ReturnRequest || mongoose.model("ReturnRequest", returnRequestSchema);