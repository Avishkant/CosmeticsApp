import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: String,
  qty: { type: Number, default: 1 },
  price: { type: Number, required: true },
});

const CartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [CartItemSchema],
    coupon: {
      code: String,
      amount: Number,
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Cart || mongoose.model("Cart", CartSchema);
