import mongoose from "mongoose";

const { Schema } = mongoose;

export const notificationAudiences = ["customer", "admin"];
export const notificationTypes = ["order", "payment", "review", "return", "inventory", "support", "system"];

const notificationSchema = new Schema(
  {
    audience: { type: String, required: true, enum: notificationAudiences },
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User" },
    recipientEmail: { type: String, trim: true, lowercase: true },
    type: { type: String, required: true, enum: notificationTypes },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    resourceType: { type: String, trim: true },
    resourceId: { type: String, trim: true },
    actionUrl: { type: String, trim: true },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ audience: 1, createdAt: -1 });
notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ recipientEmail: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);