import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: String,
  qty: Number,
  price: Number,
  mrp: Number,
});

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [OrderItemSchema],
    subtotal: Number,
    discounts: [{ type: Object }],
    shipping: { method: String, cost: Number, courier: String, awb: String },
    tax: Number,
    total: Number,
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    payment: {
      provider: String,
      status: String,
      transactionId: String,
      meta: Object,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
