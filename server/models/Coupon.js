import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, index: true, uppercase: true, required: true },
    type: { type: String, enum: ["percentage", "flat"], required: true },
    value: { type: Number, required: true },
    appliesTo: { type: Object },
    usageLimit: Number,
    perUserLimit: Number,
    validFrom: Date,
    validUntil: Date,
    active: { type: Boolean, default: true },
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
