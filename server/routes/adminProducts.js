import express from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import Product from "../models/Product.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { indexProduct } from "../services/search.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/admin/products/import
router.post(
  "/import",
  requireAuth,
  requireRole("admin"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ error: "CSV file required in field `file`" });
      const text = req.file.buffer.toString("utf8");
      const records = parse(text, { columns: true, skip_empty_lines: true });
      let created = 0,
        updated = 0,
        errors = [];
      for (const row of records) {
        try {
          const tags = row.tags
            ? row.tags
                .split(/[;,|]/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
          const imageUrls = row.imageUrls
            ? row.imageUrls
                .split(/[;,|]/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
          const variants = [];
          if (row.variantSku || row.variantName) {
            variants.push({
              variantId: row.variantSku || undefined,
              name: row.variantName || undefined,
              sku: row.variantSku || undefined,
              mrp: row.variantMrp ? Number(row.variantMrp) : undefined,
              price: row.variantPrice ? Number(row.variantPrice) : undefined,
              stock: row.variantStock ? Number(row.variantStock) : 0,
              attributes: {},
            });
          }

          const search = {};
          if (row.slug) search.slug = row.slug;
          else if (row.sku) search.sku = row.sku;

          let prod = null;
          if (Object.keys(search).length) prod = await Product.findOne(search);

          if (prod) {
            // update fields
            prod.title = row.title || prod.title;
            prod.brand = row.brand || prod.brand;
            prod.description = row.description || prod.description;
            prod.tags = Array.from(new Set([...(prod.tags || []), ...tags]));
            // append images
            for (const u of imageUrls)
              prod.images.push({
                url: u,
                alt: "",
                order: prod.images.length + 1,
              });
            // append variants
            for (const v of variants) prod.variants.push(v);
            await prod.save();
            updated++;
            indexProduct(prod).catch(() => {});
          } else {
            const payload = {
              title: row.title || "Untitled",
              slug:
                row.slug ||
                (row.title
                  ? row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                  : undefined),
              sku: row.sku,
              brand: row.brand,
              description: row.description,
              tags,
              images: imageUrls.map((u, i) => ({
                url: u,
                alt: "",
                order: i + 1,
              })),
              variants,
            };
            await Product.create(payload);
            created++;
          }
        } catch (err) {
          errors.push({ row, error: err.message });
        }
      }

      // record audit
      await AuditLog.create({
        userId: req.user.id,
        action: "import_products",
        resource: "products_csv",
        meta: { created, updated, errorsCount: errors.length },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        data: {
          created,
          updated,
          errors: errors.length,
          details: errors.slice(0, 10),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

// POST /api/admin/products/stocks/import - CSV with columns sku,variantSku,stock
router.post(
  "/stocks/import",
  requireAuth,
  requireRole("admin"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ error: "CSV file required in field `file`" });
      const text = req.file.buffer.toString("utf8");
      const records = parse(text, { columns: true, skip_empty_lines: true });
      let updated = 0;
      const errors = [];
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // header is line 1
        try {
          const sku = row.sku || row.SKU;
          const variantSku =
            row.variantSku || row.variant_sku || row.sku_variant;
          const stock = Number(row.stock || row.Stock || 0);
          if (!sku && !variantSku) {
            errors.push({ row, rowNumber, error: "Missing sku or variantSku" });
            continue;
          }
          // find product by sku or variant sku
          let prod = null;
          if (sku) prod = await Product.findOne({ sku });
          if (!prod && variantSku)
            prod = await Product.findOne({ "variants.sku": variantSku });
          if (!prod) {
            errors.push({ row, error: "Product not found" });
            continue;
          }
          const dryRun =
            req.query.dryRun === "true" ||
            req.query.dryRun === "1" ||
            req.body.dryRun === true;
          if (variantSku) {
            const v = prod.variants.find((vv) => vv.sku === variantSku);
            if (!v) {
              errors.push({ row, rowNumber, error: "Variant not found" });
              continue;
            }
            if (dryRun) {
              // report intended change
              errors.push({
                row,
                rowNumber,
                info: "dry-run",
                sku: prod.sku || "",
                variantSku,
                oldStock: v.stock || 0,
                newStock: stock,
              });
            } else {
              v.stock = stock;
              await prod.save();
              updated++;
            }
          } else {
            // apply to first variant if present
            if (prod.variants && prod.variants.length > 0) {
              if (dryRun) {
                errors.push({
                  row,
                  rowNumber,
                  info: "dry-run",
                  sku: prod.sku || "",
                  variantSku: "",
                  oldStock: prod.variants[0].stock || 0,
                  newStock: stock,
                });
              } else {
                prod.variants[0].stock = stock;
                await prod.save();
                updated++;
              }
            } else {
              errors.push({ row, rowNumber, error: "No variants to update" });
              continue;
            }
          }
        } catch (err) {
          errors.push({ row, error: err.message });
        }
      }
      // if not dry-run, record audit
      const dryRunOverall =
        req.query.dryRun === "true" ||
        req.query.dryRun === "1" ||
        req.body.dryRun === true;
      if (!dryRunOverall) {
        await AuditLog.create({
          userId: req.user.id,
          action: "import_stocks",
          resource: "stocks_csv",
          meta: { updated, errors: errors.length },
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }
      // separate dry-run info vs real errors
      const details = errors.slice(0, 200);
      res.json({
        data: {
          updated,
          errors: errors.length,
          details,
          dryRun: dryRunOverall,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/products/stocks/export - export products stocks as CSV
router.get(
  "/stocks/export",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const prods = await Product.find({}).lean();
      // build CSV rows: sku, variantSku, variantName, stock
      const rows = [];
      for (const p of prods) {
        if (p.variants && p.variants.length > 0) {
          for (const v of p.variants) {
            rows.push({
              sku: p.sku || "",
              variantSku: v.sku || "",
              variantName: v.name || "",
              stock: v.stock || 0,
            });
          }
        } else {
          rows.push({
            sku: p.sku || "",
            variantSku: "",
            variantName: "",
            stock: 0,
          });
        }
      }
      // simple CSV serialization
      const header = "sku,variantSku,variantName,stock\n";
      const body = rows
        .map(
          (r) =>
            `${r.sku || ""},${r.variantSku || ""},"${(
              r.variantName || ""
            ).replace(/"/g, '""')}",${r.stock}`
        )
        .join("\n");
      const csv = header + body;
      res.setHeader("Content-Disposition", 'attachment; filename="stocks.csv"');
      res.setHeader("Content-Type", "text/csv");
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);
