import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, index: true, unique: true },
    // optional logo image URL for brand (admin provides URL or upload link)
    logo: String,
    // store Cloudinary public_id when image uploaded via server so we can
    // delete the asset if the brand is removed or updated
    logoPublicId: String,
    description: String,
  },
  { timestamps: true }
);

export default mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
