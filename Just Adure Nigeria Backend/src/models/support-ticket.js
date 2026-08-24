import mongoose from "mongoose";

const { Schema } = mongoose;

export const supportTicketStatuses = ["open", "in_progress", "waiting_for_customer", "resolved", "closed"];
export const supportTicketTypes = ["contact", "product_enquiry", "order_support"];

const supportReplySchema = new Schema(
  {
    authorType: { type: String, required: true, enum: ["customer", "admin"] },
    authorName: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

const supportTicketSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: supportTicketTypes, default: "contact" },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 30 },
    orderNumber: { type: String, trim: true, maxlength: 80 },
    productSlug: { type: String, trim: true, maxlength: 180 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, required: true, enum: supportTicketStatuses, default: "open" },
    replies: { type: [supportReplySchema], required: true, default: [] },
    internalNote: { type: String, trim: true, maxlength: 1000 },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

supportTicketSchema.index({ ticketNumber: 1 }, { unique: true });
supportTicketSchema.index({ email: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

export const SupportTicket = mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);