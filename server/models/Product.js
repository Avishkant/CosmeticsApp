import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema({
  variantId: { type: String },
  name: { type: String },
  sku: { type: String },
  mrp: { type: Number },
  price: { type: Number },
  stock: { type: Number, default: 0 },
  attributes: { type: Object },
});

const ImageSchema = new mongoose.Schema({
  url: String,
  alt: String,
  order: Number,
  public_id: String,
});

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true, unique: true, required: true },
    sku: { type: String, index: true },
    // legacy free-text brand for backward compatibility
    brand: String,
    // normalized brand reference
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    description: String,
    images: [ImageSchema],
    variants: [VariantSchema],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    tags: [String],
    attributes: [{ key: String, value: String }],
    rating: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Create a text index for simple full-text search on common fields
ProductSchema.index({
  title: "text",
  description: "text",
  brand: "text",
  tags: "text",
});

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
