import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  label: String,
  name: String,
  phone: String,
  addressLine1: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
});

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    addresses: [AddressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    refreshTokens: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
