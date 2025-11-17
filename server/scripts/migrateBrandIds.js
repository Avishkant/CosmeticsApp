+/*
  Migration helper: populate product.brandId by matching product.brand (string) to Brand.name.
  Usage: node ./scripts/migrateBrandIds.js
  Ensure MONGO_URI/.env is configured and server dependencies installed.
*/
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import Brand from "../models/Brand.js";

dotenv.config({ path: "./.env" });

const MONGO =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "mongodb://localhost:27017/cosmetics";

async function run() {
  await mongoose.connect(MONGO);
  console.log("Connected to DB");
  const prods = await Product.find({}).lean();
  let updated = 0;
  for (const p of prods) {
    if (!p.brand) continue;
    // skip if brandId already set
    if (p.brandId) continue;
    const b = await Brand.findOne({ name: p.brand }).lean();
    if (b) {
      await Product.findByIdAndUpdate(p._id, { brandId: b._id });
      updated++;
      console.log("Updated", p._id.toString(), "->", b.name);
    }
  }
  console.log("Done. Updated:", updated);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
