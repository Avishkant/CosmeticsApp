import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Load environment from the server folder .env (same as server/index.js)
dotenv.config({ path: "./.env" });

// Require DATABASE_URL or MONGO_URI from env — do not fall back to a hard-coded localhost DB URL.
const MONGO = process.env.DATABASE_URL || process.env.MONGO_URI;
if (!MONGO) {
  console.error(
    "MONGO_URI or DATABASE_URL must be set in server/.env for scripts. Aborting."
  );
  process.exit(1);
}

async function createAdmin(email, password, name = "Admin") {
  await mongoose.connect(MONGO);
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: "admin",
  });
  console.log("Created admin:", user.email);
  process.exit(0);
}

const [, , email, password] = process.argv;
if (!email || !password) {
  console.log("Usage: node scripts/createAdmin.js <email> <password>");
  process.exit(1);
}

createAdmin(email, password).catch((err) => {
  console.error(err);
  process.exit(1);
});
