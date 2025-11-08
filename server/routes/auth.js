import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  removeRefreshToken,
  verifyRefreshToken,
  requireAuth,
} from "../middleware/auth.js";

import { validateBody, schemas } from "../middleware/validate.js";

const router = express.Router();

// POST /api/auth/register
router.post(
  "/register",
  validateBody(schemas.authRegister),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ error: "Email and password required" });
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: "User exists" });
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashed,
        role: "user",
      });
      const access = signAccessToken({ id: user._id, role: user.role });
      const refresh = signRefreshToken({ id: user._id, role: user.role });
      await saveRefreshToken(user._id, refresh);
      res.status(201).json({
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          access,
          refresh,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  validateBody(schemas.authLogin),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
      const access = signAccessToken({ id: user._id, role: user.role });
      const refresh = signRefreshToken({ id: user._id, role: user.role });
      await saveRefreshToken(user._id, refresh);
      res.json({
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          access,
          refresh,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh - exchange refresh token for new access token
router.post("/refresh", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({ error: "Refresh token required" });
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const user = await User.findById(payload.id);
    if (!user || !user.refreshTokens || !user.refreshTokens.includes(token))
      return res.status(401).json({ error: "Invalid refresh token" });
    const access = signAccessToken({ id: user._id, role: user.role });
    // rotate refresh token
    const newRefresh = signRefreshToken({ id: user._id, role: user.role });
    await removeRefreshToken(user._id, token);
    await saveRefreshToken(user._id, newRefresh);
    res.json({ data: { access, refresh: newRefresh } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({ error: "Refresh token required" });
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      return res.status(400).json({ error: "Invalid token" });
    }
    await removeRefreshToken(payload.id, token);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

// GET /api/auth/me - return current user profile
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});
