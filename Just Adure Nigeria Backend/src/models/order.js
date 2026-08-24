import mongoose from "mongoose";

const { Schema } = mongoose;

export const orderStatuses = [
  "pending_payment",
  "paid",
  "processing",
  "ready_for_pickup",
  "ready_for_delivery",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "return_requested",
  "returned",
  "refunded",
];

export const paymentStatuses = [
  "pending",
  "successful",
  "failed",
  "abandoned",
  "refunded",
  "partially_refunded",
];

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    condition: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    unitPriceKobo: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineSubtotalKobo: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const addressSnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    deliveryInstructions: { type: String, trim: true },
  },
  { _id: false },
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true, enum: orderStatuses },
    note: { type: String, trim: true },
    changedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const reservationSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    quantity: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true },
    releasedAt: { type: Date },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    customer: { type: addressSnapshotSchema, required: true },
    items: { type: [orderItemSchema], required: true, default: [] },
    subtotalKobo: { type: Number, required: true, min: 0 },
    discountKobo: { type: Number, required: true, min: 0, default: 0 },
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon" },
    couponCode: { type: String, trim: true, uppercase: true },
    deliveryFeeKobo: { type: Number, required: true, min: 0 },
    totalKobo: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "NGN" },
    deliveryZoneId: { type: Schema.Types.ObjectId, ref: "DeliveryZone" },
    deliveryMethod: { type: String, required: true, enum: ["delivery", "pickup"], default: "delivery" },
    paymentStatus: { type: String, required: true, enum: paymentStatuses, default: "pending" },
    orderStatus: { type: String, required: true, enum: orderStatuses, default: "pending_payment" },
    statusHistory: { type: [statusHistorySchema], required: true, default: [] },
    reservations: { type: [reservationSchema], required: true, default: [] },
    customerNotes: { type: String, trim: true },
    adminNotes: { type: String, trim: true },
  },
  { timestamps: true },
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });
orderSchema.index({ "reservations.expiresAt": 1, paymentStatus: 1 });

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

