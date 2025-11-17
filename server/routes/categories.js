import express from "express";
import Category from "../models/Category.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/categories
router.get("/", async (req, res, next) => {
  try {
    const list = await Category.find({}).sort({ name: 1 }).lean();
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:id
router.get("/:id", async (req, res, next) => {
  try {
    const c = await Category.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ error: "Not found" });
    res.json({ data: c });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/categories
router.post(
  "/admin/categories",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const payload = req.body;
      const exists = await Category.findOne({ name: payload.name });
      if (exists) return res.status(409).json({ error: "Category exists" });
      const slug = (payload.slug || payload.name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const c = await Category.create({ ...payload, slug });
      await AuditLog.create({
        userId: req.user.id,
        action: "create_category",
        resource: "category",
        meta: { id: c._id, name: c.name },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(201).json({ data: c });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/admin/categories/:id
router.put(
  "/admin/categories/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const updated = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      ).lean();
      if (!updated) return res.status(404).json({ error: "Not found" });
      await AuditLog.create({
        userId: req.user.id,
        action: "update_category",
        resource: "category",
        meta: { id: updated._id },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/categories/:id
router.delete(
  "/admin/categories/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const removed = await Category.findByIdAndDelete(req.params.id).lean();
      if (!removed) return res.status(404).json({ error: "Not found" });
      await AuditLog.create({
        userId: req.user.id,
        action: "delete_category",
        resource: "category",
        meta: { id: removed._id },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.json({ data: removed });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
