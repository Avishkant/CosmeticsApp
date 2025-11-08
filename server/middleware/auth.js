import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config({ path: "./.env" });

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  (process.env.JWT_SECRET || "change_this_secret") + "_refresh";

export function signAccessToken(payload, expiresIn = "1h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function signRefreshToken(payload, expiresIn = "30d") {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

export async function saveRefreshToken(userId, token) {
  await User.findByIdAndUpdate(userId, { $addToSet: { refreshTokens: token } });
}

export async function removeRefreshToken(userId, token) {
  await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: token } });
}

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  const token = auth.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(role = "admin") {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role)
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
