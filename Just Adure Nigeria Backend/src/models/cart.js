import mongoose from "mongoose";
const { Schema } = mongoose;
const cartItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    quantity: { type: Number, required: true, min: 1 },
    addedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });
const cartSchema = new Schema({
    cartKey: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    items: { type: [cartItemSchema], required: true, default: [] },
    expiresAt: { type: Date },
}, { timestamps: true });
cartSchema.index({ cartKey: 1 }, { unique: true });
cartSchema.index({ userId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const Cart = mongoose.models.Cart ||
    mongoose.model("Cart", cartSchema);
