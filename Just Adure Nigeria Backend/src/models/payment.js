import mongoose from "mongoose";

const { Schema } = mongoose;

export const paymentStatuses = ["pending", "successful", "failed", "abandoned", "refunded", "partially_refunded"];

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, required: true, ref: "Order" },
    orderNumber: { type: String, required: true, trim: true },
    reference: { type: String, required: true, trim: true },
    paystackTransactionId: { type: String, trim: true },
    amountKobo: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "NGN" },
    status: { type: String, required: true, enum: paymentStatuses, default: "pending" },
    channel: { type: String, trim: true },
    gatewayResponse: { type: String, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    authorizationUrl: { type: String, trim: true },
    accessCode: { type: String, trim: true },
    paidAt: { type: Date },
    verifiedAt: { type: Date },
    rawInitializeResponse: { type: Schema.Types.Mixed },
    rawVerificationResponse: { type: Schema.Types.Mixed },
    processedWebhookHashes: { type: [String], required: true, default: [] },
  },
  { timestamps: true },
);

paymentSchema.index({ reference: 1 }, { unique: true });
paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ paystackTransactionId: 1 }, { sparse: true });

export const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);