import mongoose from "mongoose";
const { Schema } = mongoose;

const wishlistItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
  addedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });

const wishlistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true, ref: "User" },
  items: { type: [wishlistItemSchema], required: true, default: [] },
}, { timestamps: true });

wishlistSchema.index({ "items.productId": 1 });

export const Wishlist = mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);