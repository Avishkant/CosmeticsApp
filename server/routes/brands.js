import express from "express";
import Brand from "../models/Brand.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import multer from "multer";
import cloudinary from "../services/cloudinary.js";

const router = express.Router();

// multer in-memory storage for small image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/brands
router.get("/", async (req, res, next) => {
  try {
    const list = await Brand.find({}).sort({ name: 1 }).lean();
    // if logo is missing but we have a Cloudinary public id, construct a CDN URL
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const normalized = (list || []).map((b) => {
      if ((!b.logo || b.logo === "") && b.logoPublicId && cloudName) {
        return {
          ...b,
          logo: `https://res.cloudinary.com/${cloudName}/image/upload/${b.logoPublicId}`,
        };
      }
      return b;
    });
    // debug log first brand to help troubleshooting
    if (normalized && normalized.length > 0)
      console.debug("brands[0]", normalized[0]);
    res.json({ data: normalized });
  } catch (err) {
    next(err);
  }
});

// GET /api/brands/:id
router.get("/:id", async (req, res, next) => {
  try {
    const b = await Brand.findById(req.params.id).lean();
    if (!b) return res.status(404).json({ error: "Not found" });
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const normalized =
      (!b.logo || b.logo === "") && b.logoPublicId && cloudName
        ? {
            ...b,
            logo: `https://res.cloudinary.com/${cloudName}/image/upload/${b.logoPublicId}`,
          }
        : b;
    console.debug("brand", normalized);
    res.json({ data: normalized });
  } catch (err) {
    next(err);
  }
});

// Debug route: GET /api/admin/brands/debug
// Returns a compact list of brands with only `_id, name, logo, logoPublicId` (admin only)
router.get(
  "/admin/brands/debug",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const list = await Brand.find({}, { name: 1, logo: 1, logoPublicId: 1 })
        .sort({ name: 1 })
        .lean();
      res.json({ data: list });
    } catch (err) {
      next(err);
    }
  }
);

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
      // fetch existing to determine if we need to cleanup old cloudinary asset
      const existing = await Brand.findById(req.params.id).lean();
      if (!existing) return res.status(404).json({ error: "Not found" });

      // if incoming logoPublicId differs from existing, attempt to remove existing asset
      try {
        if (
          existing.logoPublicId &&
          req.body &&
          req.body.logoPublicId &&
          existing.logoPublicId !== req.body.logoPublicId
        ) {
          await cloudinary.uploader.destroy(existing.logoPublicId, {
            resource_type: "image",
          });
        }
      } catch (e) {
        console.error(
          "Failed to remove old cloudinary asset during update:",
          e?.message || e
        );
      }

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

      // attempt to remove associated Cloudinary asset if we have the public id
      if (removed.logoPublicId) {
        try {
          await cloudinary.uploader.destroy(removed.logoPublicId, {
            resource_type: "image",
          });
        } catch (e) {
          // don't block deletion if cloudinary removal fails; just log
          console.error("Failed to remove cloudinary asset:", e?.message || e);
        }
      }

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

// POST /api/admin/brands/upload
// Accepts a single file field named `image`, uploads to Cloudinary and returns URL
router.post(
  "/admin/brands/upload",
  requireAuth,
  requireRole("admin"),
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const streamUpload = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "brands", resource_type: "image" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(buffer);
        });

      const result = await streamUpload(req.file.buffer);
      // if brandId query provided, attach the uploaded image to that brand
      const brandId = req.query.brandId || req.body?.brandId;
      let updatedBrand = null;
      if (brandId) {
        try {
          updatedBrand = await Brand.findByIdAndUpdate(
            brandId,
            { logo: result.secure_url, logoPublicId: result.public_id },
            { new: true }
          ).lean();
        } catch (e) {
          console.error(
            "Failed to attach uploaded logo to brand:",
            e?.message || e
          );
        }
      }

      res.json({
        data: { url: result.secure_url, raw: result, brand: updatedBrand },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
