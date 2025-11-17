import express from "express";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/admin/users - list users
router.get("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password -refreshTokens").lean();
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/:id
router.get(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const u = await User.findById(req.params.id)
        .select("-password -refreshTokens")
        .lean();
      if (!u) return res.status(404).json({ error: "Not found" });
      res.json({ data: u });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/admin/users/:id - update user (role, name, phone, addresses)
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const allowed = (({ name, phone, role, addresses }) => ({
        name,
        phone,
        role,
        addresses,
      }))(req.body || {});
      const updated = await User.findByIdAndUpdate(req.params.id, allowed, {
        new: true,
      })
        .select("-password -refreshTokens")
        .lean();
      if (!updated) return res.status(404).json({ error: "Not found" });
      await AuditLog.create({
        userId: req.user.id,
        action: "update_user",
        resource: "user",
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

// DELETE /api/admin/users/:id
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const removed = await User.findByIdAndDelete(req.params.id).lean();
      if (!removed) return res.status(404).json({ error: "Not found" });
      await AuditLog.create({
        userId: req.user.id,
        action: "delete_user",
        resource: "user",
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
