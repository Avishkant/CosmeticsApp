import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, index: true, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    description: String,
  },
  { timestamps: true }
);

export default mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);
