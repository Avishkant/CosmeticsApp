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
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });
    const coupon = await (
      await import("../models/Coupon.js")
    ).default.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ error: "Invalid code" });
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    // compute subtotal
    const subtotal = cart.items.reduce(
      (s, i) => s + (i.price || 0) * (i.qty || 0),
      0
    );
    const amount =
      coupon.type === "percentage"
        ? subtotal * (coupon.value / 100)
        : coupon.value;
    cart.coupon = { code: coupon.code, amount };
    await cart.save();
    res.json({ data: cart });
  } catch (err) {
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
      res.json({ data: cart });
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
    res.json({ data: cart });
  } catch (err) {
    next(err);
  }
});

export default router;
