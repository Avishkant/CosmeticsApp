import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, schemas } from "../middleware/validate.js";

const router = express.Router();

// GET /api/cart - get current user's cart
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate("items.productId")
      .lean();
    res.json({ data: cart || { items: [] } });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/coupon - apply a coupon to cart
router.post("/coupon", requireAuth, async (req, res, next) => {
  try {
    let { code } = req.body || {};
    console.log(
      "[cart.coupon] apply request by user:",
      req.user && req.user.id,
      "code:",
      code
    );
    // Defensive: ensure code is a string before calling toUpperCase
    if (code == null) return res.status(400).json({ error: "Code required" });
    if (typeof code !== "string") {
      try {
        code = String(code);
      } catch (e) {
        return res.status(400).json({ error: "Invalid code" });
      }
    }
    const codeStr = code.trim();
    if (!codeStr) return res.status(400).json({ error: "Code required" });
    const Coupon = (await import("../models/Coupon.js")).default;
    const coupon = await Coupon.findOne({
      code: codeStr.toUpperCase(),
      active: true,
    });
    console.log(
      "[cart.coupon] coupon lookup result:",
      !!coupon,
      coupon && coupon.code
    );
    if (!coupon) return res.status(404).json({ error: "Invalid code" });

    // fetch or create cart
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      // nothing in cart — return a clear error
      return res.status(400).json({ error: "Cart is empty" });
    }

    // validate date windows
    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom))
      return res.status(400).json({ error: "Coupon not yet valid" });
    if (coupon.validUntil && now > new Date(coupon.validUntil))
      return res.status(400).json({ error: "Coupon expired" });

    // compute subtotal defensively
    const subtotal = (cart.items || []).reduce((s, i) => {
      const p = Number(i.price || 0);
      const q = Number(i.qty || 0);
      return s + (Number.isFinite(p) ? p : 0) * (Number.isFinite(q) ? q : 0);
    }, 0);
    console.log("[cart.coupon] computed subtotal:", subtotal);

    let amount = 0;
    // Defensive coercions
    const cValue = Number(coupon.value || 0);
    if (!Number.isFinite(cValue)) {
      console.error("[cart.coupon] invalid coupon value", coupon.value);
      return res.status(400).json({ error: "Coupon configuration invalid" });
    }
    if (coupon.type === "percentage") {
      const pct = cValue;
      amount = subtotal * (pct / 100);
    } else {
      amount = Math.min(cValue, subtotal);
    }

    console.log("[cart.coupon] calculated amount:", amount);

    if (!Number.isFinite(amount) || amount <= 0)
      return res.status(400).json({ error: "Coupon not applicable" });

    // attach coupon to cart and save
    cart.coupon = { code: coupon.code, amount };
    await cart.save();
    console.log("[cart.coupon] coupon attached to cart", cart._id.toString());

    // return populated cart and useful totals so client can display discount
    const populated = await Cart.findById(cart._id)
      .populate("items.productId")
      .lean();
    const roundedSubtotal = Math.round(subtotal * 100) / 100;
    const roundedAmount = Math.round(amount * 100) / 100;
    const totalAfter = Math.max(
      0,
      Math.round((roundedSubtotal - roundedAmount) * 100) / 100
    );
    res.json({
      data: populated,
      meta: {
        subtotal: roundedSubtotal,
        discount: roundedAmount,
        total: totalAfter,
      },
    });
  } catch (err) {
    console.error("Failed to apply coupon", err);
    next(err);
  }
});

// DELETE /api/cart/coupon - remove coupon
router.delete("/coupon", requireAuth, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    cart.coupon = null;
    await cart.save();
    res.json({ data: cart });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart - add/update an item
router.post(
  "/",
  requireAuth,
  validateBody(schemas.cartUpdate),
  async (req, res, next) => {
    try {
      const { productId, variantId, qty, price } = req.body;
      let cart = await Cart.findOne({ userId: req.user.id });
      if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });
      const existing = cart.items.find(
        (i) =>
          i.productId.toString() === productId &&
          (i.variantId || "") === (variantId || "")
      );
      if (existing) existing.qty = qty;
      else cart.items.push({ productId, variantId, qty, price });
      cart.updatedAt = new Date();
      await cart.save();
      // return populated cart so client has product details (images, title, etc.)
      const populated = await Cart.findById(cart._id)
        .populate("items.productId")
        .lean();
      res.json({ data: populated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/cart/:itemId
router.delete("/:itemId", requireAuth, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    cart.items = cart.items.filter(
      (i) => i._id.toString() !== req.params.itemId
    );
    await cart.save();
    const populated = await Cart.findById(cart._id)
      .populate("items.productId")
      .lean();
    res.json({ data: populated });
  } catch (err) {
    next(err);
  }
});

export default router;
