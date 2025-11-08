import express from "express";
import Coupon from "../models/Coupon.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody, schemas } from "../middleware/validate.js";

const router = express.Router();

// POST /api/admin/coupons - create coupon (admin)
router.post(
  "/admin/coupons",
  requireAuth,
  requireRole("admin"),
  validateBody(schemas.couponCreate),
  async (req, res, next) => {
    try {
      const payload = req.body;
      const exists = await Coupon.findOne({ code: payload.code });
      if (exists) return res.status(409).json({ error: "Coupon exists" });
      const c = await Coupon.create(payload);
      // audit
      await AuditLog.create({
        userId: req.user.id,
        action: "create_coupon",
        resource: "coupon",
        meta: { code: c.code },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(201).json({ data: c });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/coupons/validate
router.post("/coupons/validate", async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      active: true,
    });
    if (!coupon) return res.status(404).json({ error: "Invalid code" });
    // validation: date range and usage limits omitted for brevity
    let amount =
      coupon.type === "percentage"
        ? subtotal * (coupon.value / 100)
        : coupon.value;
    res.json({ data: { code: coupon.code, amount } });
  } catch (err) {
    next(err);
  }
});

export default router;
