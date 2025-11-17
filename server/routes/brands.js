import express from "express";
import Brand from "../models/Brand.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/brands
router.get("/", async (req, res, next) => {
  try {
    const list = await Brand.find({}).sort({ name: 1 }).lean();
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/brands/:id
router.get("/:id", async (req, res, next) => {
  try {
    const b = await Brand.findById(req.params.id).lean();
    if (!b) return res.status(404).json({ error: "Not found" });
    res.json({ data: b });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/brands
router.post(
  "/admin/brands",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const payload = req.body;
      const exists = await Brand.findOne({ name: payload.name });
      if (exists) return res.status(409).json({ error: "Brand exists" });
      const slug = (payload.slug || payload.name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const b = await Brand.create({ ...payload, slug });
      await AuditLog.create({
        userId: req.user.id,
        action: "create_brand",
        resource: "brand",
        meta: { id: b._id, name: b.name },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(201).json({ data: b });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/admin/brands/:id
router.put(
  "/admin/brands/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const updated = await Brand.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }).lean();
      if (!updated) return res.status(404).json({ error: "Not found" });
      await AuditLog.create({
        userId: req.user.id,
        action: "update_brand",
        resource: "brand",
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

// DELETE /api/admin/brands/:id
router.delete(
  "/admin/brands/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const removed = await Brand.findByIdAndDelete(req.params.id).lean();
      if (!removed) return res.status(404).json({ error: "Not found" });
      await AuditLog.create({
        userId: req.user.id,
        action: "delete_brand",
        resource: "brand",
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
