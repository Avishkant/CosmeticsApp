import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import productsRouter from "./routes/products.js";
import authRouter from "./routes/auth.js";
import cartRouter from "./routes/cart.js";
import ordersRouter from "./routes/orders.js";
import couponsRouter from "./routes/coupons.js";
import adminProductsRouter from "./routes/adminProducts.js";
import brandsRouter from "./routes/brands.js";
import categoriesRouter from "./routes/categories.js";
import adminUsersRouter from "./routes/adminUsers.js";
import usersRouter from "./routes/users.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { sanitize } from "./middleware/sanitize.js";
import { startReconcileJob } from "./jobs/reconcile.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 5000;
// support both MONGO_URI (Atlas) and DATABASE_URL (local)
const MONGO =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "mongodb://localhost:27017/cosmetics";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
// Security middlewares (basic)
app.use(helmet());
app.use(sanitize);
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Health
app.get("/health", (req, res) => res.json({ status: "ok" }));

// API routes
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/cart", cartRouter);
// Mount ordersRouter at /api so routes like /admin/orders and /checkout match
app.use("/api", ordersRouter);
// couponsRouter contains both admin routes (e.g. /admin/coupons)
// and a public validate route (/coupons/validate). Mount it at /api
// so the routes become /api/admin/coupons and /api/coupons/validate.
app.use("/api", couponsRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/brands", brandsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/users", usersRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

async function start() {
  try {
    await mongoose.connect(MONGO);
    console.log("Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`Server listening on http://localhost:${PORT}`)
    );
    // start background jobs
    try {
      startReconcileJob();
    } catch (e) {
      console.error("Failed to start reconcile job", e);
    }
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
