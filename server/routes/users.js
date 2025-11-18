import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/users/me - return current user's profile
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    // don't leak password or refresh tokens
    const safe = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses || [],
    };
    res.json({ data: safe });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me - update profile fields (name, phone)
router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (typeof name === "string") user.name = name;
    if (typeof phone === "string") user.phone = phone;
    await user.save();
    res.json({
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// Addresses CRUD
// POST /api/users/me/addresses - add address
router.post("/me/addresses", requireAuth, async (req, res, next) => {
  try {
    const addr = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.addresses = user.addresses || [];
    user.addresses.push(addr);
    await user.save();
    res.status(201).json({ data: user.addresses[user.addresses.length - 1] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me/addresses/:idx - update address by array index or _id if present
router.put("/me/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const idx = user.addresses.findIndex((a) => String(a._id) === String(id));
    if (idx === -1) return res.status(404).json({ error: "Address not found" });
    user.addresses[idx] = { ...user.addresses[idx].toObject(), ...req.body };
    await user.save();
    res.json({ data: user.addresses[idx] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/me/addresses/:id - delete address
router.delete("/me/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const idx = user.addresses.findIndex((a) => String(a._id) === String(id));
    if (idx === -1) return res.status(404).json({ error: "Address not found" });
    const removed = user.addresses.splice(idx, 1);
    await user.save();
    res.json({ data: removed[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/orders - list user's orders
router.get("/me/orders", requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/wishlist - list product ids in wishlist (populate optional)
router.get("/me/wishlist", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "wishlist",
      select: "title slug images price variants",
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ data: user.wishlist || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/me/wishlist - add productId to wishlist
router.post("/me/wishlist", requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ error: "productId required" });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.wishlist = user.wishlist || [];
    if (!user.wishlist.find((id) => String(id) === String(productId))) {
      user.wishlist.push(productId);
      await user.save();
    }
    res.status(201).json({ data: user.wishlist });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/me/wishlist/:productId - remove product from wishlist
router.delete(
  "/me/wishlist/:productId",
  requireAuth,
  async (req, res, next) => {
    try {
      const pid = req.params.productId;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      user.wishlist = (user.wishlist || []).filter(
        (id) => String(id) !== String(pid)
      );
      await user.save();
      res.json({ data: user.wishlist });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
