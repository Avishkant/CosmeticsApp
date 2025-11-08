import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config({ path: "./.env" });

const MONGO = process.env.DATABASE_URL || "mongodb://localhost:27017/cosmetics";

const sampleProducts = [
  {
    title: "Hydrating Facial Serum - Rose Extract",
    slug: "hydrating-facial-serum-rose",
    sku: "HS-ROSE-30",
    brand: "GlowLab",
    description:
      "A lightweight hydrating serum with rose extract to soothe and brighten skin.",
    images: [
      {
        url: "https://via.placeholder.com/600x600?text=Serum+1",
        alt: "Hydrating Serum",
        order: 1,
      },
    ],
    variants: [
      {
        variantId: "v1",
        name: "30ml",
        sku: "HS-ROSE-30",
        mrp: 799,
        price: 599,
        stock: 120,
        attributes: { size: "30ml" },
      },
      {
        variantId: "v2",
        name: "50ml",
        sku: "HS-ROSE-50",
        mrp: 1199,
        price: 899,
        stock: 60,
        attributes: { size: "50ml" },
      },
    ],
    tags: ["hydrating", "serum", "rose"],
  },
  {
    title: "SPF 50 Sunscreen Lotion",
    slug: "spf-50-sunscreen-lotion",
    sku: "SS-SPF50-100",
    brand: "SunShield",
    description:
      "Broad-spectrum sunscreen with lightweight finish. Suitable for all skin types.",
    images: [
      {
        url: "https://via.placeholder.com/600x600?text=Sunscreen",
        alt: "Sunscreen",
        order: 1,
      },
    ],
    variants: [
      {
        variantId: "v1",
        name: "100ml",
        sku: "SS-SPF50-100",
        mrp: 499,
        price: 399,
        stock: 200,
        attributes: { size: "100ml" },
      },
    ],
    tags: ["sunscreen", "spf", "broad-spectrum"],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO);
    console.log("Connected to MongoDB");

    // Optional: clear collection
    await Product.deleteMany({});

    const created = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${created.length} products`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed", err);
    process.exit(1);
  }
}

seed();
