import mongoose from "mongoose";
const { Schema } = mongoose;
export const userRoles = [
    "customer",
    "admin",
    "super_admin",
    "inventory_manager",
    "order_manager",
    "customer_support",
    "content_manager",
];
const addressSchema = new Schema({
    label: { type: String, required: true, trim: true },
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    deliveryInstructions: { type: String, trim: true },
    isDefault: { type: Boolean, required: true, default: false },
}, { _id: true, timestamps: true });
const userSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roles: { type: [String], enum: userRoles, required: true, default: ["customer"] },
    permissions: { type: [String], required: true, default: [] },
    emailVerifiedAt: { type: Date },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationTokenExpiresAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetTokenExpiresAt: { type: Date, select: false },
    isActive: { type: Boolean, required: true, default: true },
    addresses: { type: [addressSchema], required: true, default: [] },
    lastLoginAt: { type: Date },
}, { timestamps: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ roles: 1, isActive: 1 });
userSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });
export const User = mongoose.models.User ||
    mongoose.model("User", userSchema);
