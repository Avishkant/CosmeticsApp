import express from "express";
import Product from "../models/Product.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import AuditLog from "../models/AuditLog.js";
import multer from "multer";
import sharp from "sharp";
import cloudinary from "../services/cloudinary.js";
import { indexProduct, removeProductFromIndex } from "../services/search.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// GET /api/products
// supports ?q=&page=&limit=&category=
router.get("/", async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20, category } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));

    const filter = {};
    if (category) filter.categories = category;
    if (q) filter.$text = { $search: q };

    const products = await Product.find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ data: products, meta: { page: pageNum, limit: limitNum } });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/slug/:slug
router.get("/slug/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).lean();
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products (admin) - minimal create
router.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const payload = req.body;
    const product = await Product.create(payload);
    // index in search if configured
    indexProduct(product).catch(() => {});
    await AuditLog.create({
      userId: req.user.id,
      action: "create_product",
      resource: "product",
      meta: { id: product._id, title: product.title },
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id (admin)
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }).lean();
      if (!updated) return res.status(404).json({ error: "Not found" });
      indexProduct(updated).catch(() => {});
      await AuditLog.create({
        userId: req.user.id,
        action: "update_product",
        resource: "product",
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

// DELETE /api/products/:id (admin)
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const removed = await Product.findByIdAndDelete(req.params.id).lean();
      if (!removed) return res.status(404).json({ error: "Not found" });
      removeProductFromIndex(req.params.id).catch(() => {});
      await AuditLog.create({
        userId: req.user.id,
        action: "delete_product",
        resource: "product",
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

// POST /api/products/:id/images - upload images for a product (admin)
router.post(
  "/:id/images",
  requireAuth,
  requireRole("admin"),
  upload.array("images", 6),
  async (req, res, next) => {
    try {
      const files = req.files || [];
      if (!files.length)
        return res.status(400).json({ error: "No files uploaded" });
      const uploads = [];
      for (const file of files) {
        // resize to reasonable max width and convert to webp
        const buffer = await sharp(file.buffer)
          .resize({ width: 1200 })
          .webp({ quality: 80 })
          .toBuffer();
        // upload to cloudinary via upload_stream
        const streamUpload = () =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "cosmetics" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            stream.end(buffer);
          });
        const result = await streamUpload();
        uploads.push({ url: result.secure_url, public_id: result.public_id });
      }
      // attach to product
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      for (const u of uploads)
        product.images.push({
          url: u.url,
          alt: "",
          order: product.images.length + 1,
          public_id: u.public_id,
        });
      await product.save();
      indexProduct(product).catch(() => {});
      await AuditLog.create({
        userId: req.user.id,
        action: "upload_product_images",
        resource: "product",
        meta: { id: product._id, uploads: uploads.length },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(201).json({ data: uploads });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/products/:id/images - update images metadata/order (admin)
router.patch(
  "/:id/images",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const { images } = req.body;
      if (!Array.isArray(images))
        return res.status(400).json({ error: "images array required" });
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      // preserve public_id when possible by matching on url
      const existingMap = {};
      for (const im of product.images || []) {
        if (im && im.url) existingMap[im.url] = im.public_id;
      }
      // replace images array with provided metadata (url, alt, order) and preserve public_id if present
      product.images = images.map((im, idx) => ({
        url: im.url,
        alt: im.alt || "",
        order: im.order || idx + 1,
        public_id: im.public_id || existingMap[im.url],
      }));
      await product.save();
      indexProduct(product).catch(() => {});
      await AuditLog.create({
        userId: req.user.id,
        action: "update_product_images",
        resource: "product",
        meta: { id: product._id, count: product.images.length },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.json({ data: product.images });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/products/:id/images - delete a single image by url or index
router.delete(
  "/:id/images",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      const { url, index } = req.body || {};
      let removedPublicId = null;
      if (typeof index !== "undefined") {
        if (index < 0 || index >= (product.images || []).length)
          return res.status(400).json({ error: "index out of range" });
        const removed = product.images.splice(index, 1)[0];
        removedPublicId = removed && removed.public_id;
      } else if (url) {
        const found = (product.images || []).find((im) => im.url === url);
        if (!found) return res.status(404).json({ error: "image not found" });
        removedPublicId = found.public_id;
        product.images = (product.images || []).filter((im) => im.url !== url);
      } else {
        return res.status(400).json({ error: "url or index required" });
      }
      // if removed image had a cloudinary public_id, try to remove it from cloudinary
      if (removedPublicId) {
        try {
          await new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(removedPublicId, (err, resu) => {
              if (err) return reject(err);
              resolve(resu);
            });
          });
        } catch (err) {
          // log and continue - don't fail the request if cloudinary delete fails
          console.error("Failed to remove cloudinary image", err);
        }
      }
      // reassign orders and preserve public_id for remaining images
      product.images = (product.images || []).map((im, i) => ({
        url: im.url,
        alt: im.alt || "",
        order: i + 1,
        public_id: im.public_id,
      }));
      await product.save();
      indexProduct(product).catch(() => {});
      await AuditLog.create({
        userId: req.user.id,
        action: "delete_product_image",
        resource: "product",
        meta: { id: product._id, remaining: product.images.length },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.json({ data: product.images });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
