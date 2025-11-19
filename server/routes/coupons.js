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

// GET /api/admin/coupons - list coupons (admin)
router.get(
  "/admin/coupons",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const list = await Coupon.find({}).sort({ createdAt: -1 }).lean();
      res.json({ data: list });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/coupons/:id - update coupon (admin)
router.patch(
  "/admin/coupons/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const allowed = (({
        code,
        type,
        value,
        appliesTo,
        usageLimit,
        perUserLimit,
        validFrom,
        validUntil,
        active,
      }) => ({
        code,
        type,
        value,
        appliesTo,
        usageLimit,
        perUserLimit,
        validFrom,
        validUntil,
        active,
      }))(req.body || {});
      if (allowed.code) allowed.code = allowed.code.toUpperCase();
      const updated = await Coupon.findByIdAndUpdate(req.params.id, allowed, {
        new: true,
      }).lean();
      if (!updated) return res.status(404).json({ error: "Not found" });
      await AuditLog.create({
        userId: req.user.id,
        action: "update_coupon",
        resource: "coupon",
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

// DELETE /api/admin/coupons/:id - delete coupon (admin)
router.delete(
  "/admin/coupons/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const removed = await Coupon.findByIdAndDelete(req.params.id).lean();
      if (!removed) return res.status(404).json({ error: "Not found" });
      await AuditLog.create({
        userId: req.user.id,
        action: "delete_coupon",
        resource: "coupon",
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

// POST /api/coupons/validate
router.post("/coupons/validate", async (req, res, next) => {
  try {
    const { code, subtotal = 0, userId, items } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      active: true,
    });
    if (!coupon) return res.status(404).json({ error: "Invalid code" });

    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom))
      return res.status(400).json({ error: "Coupon not yet valid" });
    if (coupon.validUntil && now > new Date(coupon.validUntil))
      return res.status(400).json({ error: "Coupon expired" });

    if (typeof coupon.usageLimit === "number" && coupon.usageLimit > 0) {
      if ((coupon.usedCount || 0) >= coupon.usageLimit)
        return res.status(400).json({ error: "Coupon usage limit reached" });
    }

    // If perUserLimit is configured and a userId is provided, check how many times
    // this user has used the coupon (based on orders discounts recorded).
    if (
      typeof coupon.perUserLimit === "number" &&
      coupon.perUserLimit > 0 &&
      userId
    ) {
      const Order = (await import("../models/Order.js")).default;
      const usedByUser = await Order.countDocuments({
        userId,
        "discounts.code": coupon.code,
      });
      if (usedByUser >= coupon.perUserLimit)
        return res.status(400).json({ error: "Coupon per-user limit reached" });
    }

    // Determine applicable subtotal. If coupon.appliesTo is not provided or type is 'all'
    // apply to full subtotal. For targeted coupons (products/categories/brands)
    // the caller must supply `items` with productId and (optionally) category/brand info
    // so we can compute the applicable portion.
    let applicableSubtotal = Number(subtotal) || 0;
    try {
      const appliesTo = coupon.appliesTo || { type: "all" };
      if (appliesTo.type && appliesTo.type !== "all") {
        if (!Array.isArray(items) || items.length === 0)
          return res.status(400).json({
            error:
              "Coupon applies to specific products/categories — provide `items` to validate",
          });

        // items expected shape: [{ productId, qty, price, product: { categoryId, brandId } }]
        // We'll compute subtotal only for matching items.
        let matched = 0;
        applicableSubtotal = 0;
        for (const it of items) {
          const price = Number(it.price || 0);
          const qty = Number(it.qty || 1);
          const prod = it.product || {};

          if (appliesTo.type === "products" && Array.isArray(appliesTo.ids)) {
            if (appliesTo.ids.map(String).includes(String(it.productId))) {
              applicableSubtotal += price * qty;
              matched++;
            }
          } else if (
            appliesTo.type === "categories" &&
            Array.isArray(appliesTo.ids)
          ) {
            if (
              appliesTo.ids
                .map(String)
                .includes(String(prod.categoryId || prod.category))
            ) {
              applicableSubtotal += price * qty;
              matched++;
            }
          } else if (
            appliesTo.type === "brands" &&
            Array.isArray(appliesTo.ids)
          ) {
            if (
              appliesTo.ids
                .map(String)
                .includes(String(prod.brandId || prod.brand))
            ) {
              applicableSubtotal += price * qty;
              matched++;
            }
          }
        }
        if (matched === 0)
          return res
            .status(400)
            .json({ error: "Coupon does not apply to selected items" });
      }
    } catch (e) {
      // fall back to total subtotal on any error computing appliesTo
      applicableSubtotal = Number(subtotal) || 0;
    }

    let amount = 0;
    if (coupon.type === "percentage") {
      amount = applicableSubtotal * (coupon.value / 100);
    } else {
      // flat amount should not exceed applicable subtotal
      amount = Math.min(Number(coupon.value || 0), applicableSubtotal);
    }

    res.json({ data: { code: coupon.code, amount } });
  } catch (err) {
    next(err);
  }
});

export default router;
