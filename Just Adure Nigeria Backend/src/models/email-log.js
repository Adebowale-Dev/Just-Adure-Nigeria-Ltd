import mongoose from "mongoose";

const { Schema } = mongoose;

export const emailStatuses = ["pending", "sent", "failed", "skipped"];

const emailLogSchema = new Schema(
  {
    recipientEmail: { type: String, required: true, trim: true, lowercase: true },
    recipientName: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    template: { type: String, required: true, trim: true },
    provider: { type: String, required: true, default: "brevo" },
    status: { type: String, required: true, enum: emailStatuses, default: "pending" },
    providerMessageId: { type: String, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    orderNumber: { type: String, trim: true },
    attempts: { type: Number, required: true, min: 0, default: 0 },
    lastError: { type: String, trim: true },
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ orderNumber: 1, template: 1 });
emailLogSchema.index({ recipientEmail: 1, createdAt: -1 });

export const EmailLog = mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);