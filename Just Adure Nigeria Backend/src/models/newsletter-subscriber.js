import mongoose from "mongoose";
const { Schema } = mongoose;

export const newsletterSubscriberStatuses = ["subscribed", "unsubscribed"];

const newsletterSubscriberSchema = new Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, trim: true },
  status: { type: String, required: true, enum: newsletterSubscriberStatuses, default: "subscribed" },
  source: { type: String, required: true, trim: true, default: "footer" },
  subscribedAt: { type: Date, required: true, default: Date.now },
  unsubscribedAt: { type: Date },
  lastIpAddress: { type: String, trim: true },
  lastUserAgent: { type: String, trim: true },
}, { timestamps: true });

newsletterSubscriberSchema.index({ status: 1, createdAt: -1 });

export const NewsletterSubscriber = mongoose.models.NewsletterSubscriber || mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);