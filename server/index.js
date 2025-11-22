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
// Require MONGO_URI / DATABASE_URL from env — do not fall back to a hard-coded localhost DB URL.
const MONGO = process.env.MONGO_URI || process.env.DATABASE_URL;
if (!MONGO) {
  console.error(
    "MONGO_URI or DATABASE_URL must be set in server/.env. Aborting startup to avoid using hard-coded defaults."
  );
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
// Security middlewares (basic)
app.use(helmet());
app.use(sanitize);
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Lightweight timing + timeout middleware to improve responsiveness diagnostics.
// Logs request duration and ensures requests that hang longer than `MAX_MS`
// return a 503 to the client, preventing silent hangs in deployments.
app.use((req, res, next) => {
  const start = Date.now();
  const MAX_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000); // default 15s

  // When response finishes, log timing
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[timing] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`
    );
  });

  // Setup timeout handler that sends a 503 if nothing sent within MAX_MS
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      console.error(
        `[timeout] Request exceeded ${MAX_MS}ms: ${req.method} ${req.originalUrl}`
      );
      try {
        res.status(503).json({ error: "Server timeout" });
      } catch (e) {
        // ignore
      }
    }
  }, MAX_MS);

  res.on("finish", () => clearTimeout(timer));
  res.on("close", () => clearTimeout(timer));
  next();
});

// Health
app.get("/health", (req, res) => res.json({ status: "ok" }));

// API routes
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/cart", cartRouter);
// register specific resource routers before the more generic orders router
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/brands", brandsRouter);
app.use("/api/categories", categoriesRouter);
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
  const payload = { error: err.message || "Internal Server Error" };
  // In development include the stack for easier debugging in browser/network tab
  if (process.env.NODE_ENV !== "production" && err && err.stack) {
    payload.stack = err.stack;
  }
  res.status(err.status || 500).json(payload);
});

async function start() {
  try {
    await mongoose.connect(MONGO);
    console.log("Connected to MongoDB");
    // Require BACKEND_URL in env so deployments control the public base URL.
    const BACKEND_URL = process.env.BACKEND_URL;
    if (!BACKEND_URL) {
      console.error(
        "BACKEND_URL must be set in server/.env (e.g. 'https://api.example.com'). Aborting startup."
      );
      process.exit(1);
    }
    app.listen(PORT, () => console.log(`Server listening on ${BACKEND_URL}`));
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
