import mongoose from "mongoose";

const { Schema } = mongoose;

const adminActivityLogSchema = new Schema(
  {
    administratorId: { type: Schema.Types.ObjectId, ref: "User" },
    administratorName: { type: String, trim: true },
    administratorEmail: { type: String, trim: true, lowercase: true },
    administratorRoles: { type: [String], required: true, default: [] },
    action: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, trim: true },
    resourceId: { type: String, trim: true },
    requestId: { type: String, trim: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

adminActivityLogSchema.index({ createdAt: -1 });
adminActivityLogSchema.index({ administratorId: 1, createdAt: -1 });
adminActivityLogSchema.index({ action: 1, resourceType: 1 });

export const AdminActivityLog = mongoose.models.AdminActivityLog || mongoose.model("AdminActivityLog", adminActivityLogSchema);