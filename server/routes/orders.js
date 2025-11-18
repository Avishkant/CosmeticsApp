import express from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody, schemas } from "../middleware/validate.js";
import dotenv from "dotenv";
import { razorInstance, razorpayKeyId } from "../services/razorpay.js";

dotenv.config({ path: "./.env" });

const router = express.Router();

// POST /api/checkout - create order and (optionally) create Razorpay order
router.post(
  "/checkout",
  requireAuth,
  validateBody(schemas.checkout),
  async (req, res, next) => {
    try {
      const { items: rawItems, shipping, couponCode, paymentMethod } = req.body;

      // helper to return a 400 with optional request body when debugging
      const sendBadRequest = (message, extra = {}) => {
        const payload = { error: message, ...extra };
        if (process.env.DEBUG_CHECKOUT === "true")
          payload.requestBody = req.body;
        return res.status(400).json(payload);
      };

      // Ensure items is present and non-empty
      if (!Array.isArray(rawItems) || rawItems.length === 0)
        return sendBadRequest("items array required and must not be empty", {});

      // Resolve authoritative prices for each item from product data
      const items = [];
      for (const it of rawItems) {
        // support both string ids and populated product objects
        let pid = it.productId;
        if (pid && typeof pid === "object") {
          pid = pid._id || pid.id || pid.toString();
        }
        // validate productId format
        if (!pid || !mongoose.Types.ObjectId.isValid(pid))
          return sendBadRequest("Invalid productId format in items", {
            productId: it.productId,
          });

        // ensure product exists and resolve variant price
        const product = await Product.findById(pid).lean();
        if (!product)
          return sendBadRequest("Product not found in items", {
            productId: it.productId,
          });

        let variant = null;
        if (it.variantId) {
          // support variant as object or id
          let vid = it.variantId;
          if (vid && typeof vid === "object") {
            vid = vid.variantId || vid._id || vid.id || vid.toString();
          }
          // if variantId provided, make sure it's present
          variant = (product.variants || []).find(
            (v) => String(v.variantId || v._id) === String(vid)
          );
          if (!variant) {
            return sendBadRequest("Variant not found for product", {
              productId: it.productId,
              variantId: it.variantId,
            });
          }
          // normalize variantId to variant.variantId when available
          it.variantId = variant.variantId || variant._id || vid;
        }
        if (!variant) variant = (product.variants || [])[0] || null;

        const price =
          (it.price && Number(it.price)) ||
          (variant && (variant.price || variant.mrp)) ||
          0;
        items.push({
          productId: pid,
          variantId:
            it.variantId ||
            (variant && (variant.variantId || variant._id)) ||
            null,
          qty: it.qty || 1,
          price,
        });
      }

      // compute subtotal
      const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
      let discounts = [];
      let total = subtotal;
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode, active: true });
        if (coupon) {
          let amount = 0;
          if (coupon.type === "percentage")
            amount = subtotal * (coupon.value / 100);
          else amount = coupon.value;
          discounts.push({ code: coupon.code, amount });
          total = total - amount;
        }
      }
      if (shipping && shipping.cost) total += shipping.cost;
      const order = await Order.create({
        userId: req.user.id,
        items,
        subtotal,
        discounts,
        shipping,
        tax: 0,
        total,
        status: "pending",
        payment: { provider: paymentMethod, status: "pending" },
      });

      // If Razorpay selected and configured, create Razorpay order
      if (paymentMethod === "razorpay" && razorInstance) {
        const rpOrder = await razorInstance.orders.create({
          amount: Math.round(total * 100),
          currency: "INR",
          receipt: `order_${order._id}`,
        });
        // attach razorpay order id to payment meta
        order.payment.meta = { razorpayOrderId: rpOrder.id };
        await order.save();
        return res.json({
          data: { order, razorpayOrder: rpOrder, razorpayKeyId: razorpayKeyId },
        });
      }

      res.json({ data: { order } });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/webhook/razorpay
router.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // minimal stub: verify signature if secret present, then update order status
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret)
      return res.status(400).json({ error: "Webhook secret not configured" });
    const signature = req.headers["x-razorpay-signature"];
    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");
    if (expected !== signature)
      return res.status(400).json({ error: "Invalid signature" });
    const payload = JSON.parse(req.body.toString());
    // handle payment events: payment.captured, payment.failed, etc.
    try {
      const event = payload.event;
      // attempt to extract order id from payload
      const paymentEntity =
        payload.payload &&
        (payload.payload.payment || payload.payload["payment"]).entity;
      const razorpayOrderId =
        paymentEntity &&
        (paymentEntity.order_id ||
          (paymentEntity.notes && paymentEntity.notes.razorpay_order_id));
      if (!razorpayOrderId) {
        console.log("Webhook received but no razorpay order id found");
        return res.json({ ok: true });
      }
      // find our order by matching payment.meta.razorpayOrderId
      const order = await Order.findOne({
        "payment.meta.razorpayOrderId": razorpayOrderId,
      });
      if (!order) {
        console.log("Order not found for razorpay order id", razorpayOrderId);
        return res.json({ ok: true });
      }
      if (event === "payment.captured" || event === "payment.authorized") {
        order.payment.status = "paid";
        order.status = "paid";
        // attach payment id
        order.payment.meta = {
          ...(order.payment.meta || {}),
          razorpayPaymentId: paymentEntity.id,
        };
        await order.save();
      } else if (event === "payment.failed") {
        order.payment.status = "failed";
        order.status = "failed";
        await order.save();
      }
      console.log("Razorpay webhook handled for order", order._id.toString());
      return res.json({ ok: true });
    } catch (e) {
      console.error("Error handling razorpay webhook", e);
      return res.status(500).json({ error: "internal" });
    }
  }
);

// POST /api/orders/verify - verify a payment from client and update order
router.post("/verify", requireAuth, express.json(), async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature)
      return res
        .status(400)
        .json({ error: "Missing payment verification fields" });
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret)
      return res.status(500).json({ error: "Razorpay secret not configured" });
    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (expected !== razorpay_signature)
      return res.status(400).json({ error: "Invalid signature" });

    // find our order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    // ensure ownership or admin
    if (order.userId.toString() !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });

    order.payment.status = "paid";
    order.status = "paid";
    order.payment.meta = {
      ...(order.payment.meta || {}),
      razorpayPaymentId: razorpay_payment_id,
    };
    await order.save();
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/orders/reconcile/:orderId - admin trigger to reconcile order with Razorpay
router.post(
  "/admin/orders/reconcile/:orderId",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });
      const rpId =
        order.payment &&
        order.payment.meta &&
        order.payment.meta.razorpayOrderId;
      if (!rpId)
        return res
          .status(400)
          .json({ error: "No razorpay order id on this order" });
      if (!razorInstance)
        return res
          .status(500)
          .json({ error: "Razorpay not configured on server" });

      // try to fetch payments for the razorpay order
      let payments = null;
      try {
        if (typeof razorInstance.orders.fetchPayments === "function") {
          payments = await razorInstance.orders.fetchPayments(rpId);
        } else if (
          typeof razorInstance.payments === "object" &&
          typeof razorInstance.payments.fetch === "function"
        ) {
          payments = { items: [] };
        } else {
          payments = { items: [] };
        }
      } catch (e) {
        console.error("Error fetching payments from razorpay", e);
        payments = { items: [] };
      }

      const items = (payments && payments.items) || [];
      if (items.length) {
        const captured = items.find((p) => p.status === "captured") || items[0];
        order.payment.status = captured.status || "captured";
        order.status =
          captured.status === "captured" ? "paid" : captured.status;
        order.payment.meta = {
          ...(order.payment.meta || {}),
          razorpayPaymentId: captured.id,
        };
        await order.save();

        await AuditLog.create({
          userId: req.user.id,
          action: "reconcile_order",
          resource: "order",
          meta: {
            orderId: order._id.toString(),
            razorpayOrderId: rpId,
            paymentId: captured.id,
            status: captured.status,
          },
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        return res.json({ data: { order, payments } });
      }
      return res.status(404).json({ error: "No payments found to reconcile" });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/orders/reconcile-bulk - reconcile multiple orders by id
router.post(
  "/admin/orders/reconcile-bulk",
  requireAuth,
  requireRole("admin"),
  express.json(),
  async (req, res, next) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0)
        return res.status(400).json({ error: "ids array required" });
      if (!razorInstance)
        return res
          .status(500)
          .json({ error: "Razorpay not configured on server" });
      const results = [];
      for (const id of ids) {
        try {
          const order = await Order.findById(id);
          if (!order) {
            results.push({ id, ok: false, error: "Order not found" });
            continue;
          }
          const rpId =
            order.payment &&
            order.payment.meta &&
            order.payment.meta.razorpayOrderId;
          if (!rpId) {
            results.push({ id, ok: false, error: "No razorpayOrderId" });
            continue;
          }
          let payments = { items: [] };
          try {
            if (
              razorInstance &&
              typeof razorInstance.orders === "object" &&
              typeof razorInstance.orders.fetchPayments === "function"
            ) {
              payments = await razorInstance.orders.fetchPayments(rpId);
            } else if (
              razorInstance &&
              typeof razorInstance.payments === "object" &&
              typeof razorInstance.payments.all === "function"
            ) {
              payments = await razorInstance.payments.all({ order_id: rpId });
            }
          } catch (e) {
            console.error("Error fetching payments for", rpId, e);
            results.push({ id, ok: false, error: "fetch_failed" });
            continue;
          }
          const items = payments.items || [];
          if (items.length) {
            const captured =
              items.find((p) => p.status === "captured") || items[0];
            order.payment.status = captured.status || "captured";
            order.status =
              captured.status === "captured" ? "paid" : captured.status;
            order.payment.meta = {
              ...(order.payment.meta || {}),
              razorpayPaymentId: captured.id,
            };
            await order.save();
            await AuditLog.create({
              userId: req.user.id,
              action: "reconcile_order_bulk",
              resource: "order",
              meta: {
                orderId: order._id.toString(),
                razorpayOrderId: rpId,
                paymentId: captured.id,
                status: captured.status,
              },
              ip: req.ip,
              userAgent: req.get("User-Agent"),
            });
            results.push({
              id,
              ok: true,
              status: order.status,
              paymentId: captured.id,
            });
          } else {
            results.push({ id, ok: false, error: "no_payments" });
          }
        } catch (e) {
          console.error("Bulk reconcile error for", id, e);
          results.push({ id, ok: false, error: "internal" });
        }
      }
      res.json({ data: results });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/orders/export - export orders CSV (admin)
router.get(
  "/admin/orders/export",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const status = req.query.status;
      const q = req.query.q;
      const filter = {};
      if (status) filter.status = status;
      if (q) filter.$or = [{ "payment.meta.razorpayOrderId": q }, { _id: q }];
      const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
      // build CSV
      const rows = [];
      rows.push([
        "orderId",
        "status",
        "total",
        "subtotal",
        "discounts",
        "paymentProvider",
        "paymentStatus",
        "razorpayOrderId",
        "razorpayPaymentId",
        "createdAt",
      ]);
      for (const o of orders) {
        const discounts = (o.discounts || [])
          .map((d) => `${d.code || ""}:${d.amount || 0}`)
          .join("|");
        const rpOrderId =
          o.payment && o.payment.meta && o.payment.meta.razorpayOrderId;
        const rpPaymentId =
          o.payment && o.payment.meta && o.payment.meta.razorpayPaymentId;
        rows.push([
          o._id.toString(),
          o.status || "",
          (o.total || 0).toString(),
          (o.subtotal || 0).toString(),
          discounts,
          (o.payment && o.payment.provider) || "",
          (o.payment && o.payment.status) || "",
          rpOrderId || "",
          rpPaymentId || "",
          new Date(o.createdAt).toISOString(),
        ]);
      }
      const csv = rows
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="orders_export.csv"'
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/audit - fetch recent audit logs (admin)
router.get(
  "/admin/audit",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const logs = await AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();
      res.json({ data: logs });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/orders - list user orders
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).lean();
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders - list recent orders (admin)
router.get(
  "/admin/orders",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page || "1", 10));
      const limit = Math.min(
        200,
        Math.max(1, parseInt(req.query.limit || "25", 10))
      );
      const status = req.query.status;
      const q = req.query.q;
      const skip = (page - 1) * limit;
      const filter = {};
      if (status) filter.status = status;
      if (q) filter.$or = [{ "payment.meta.razorpayOrderId": q }, { _id: q }];
      const total = await Order.countDocuments(filter);
      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      res.json({ data: orders, meta: { page, limit, total } });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/orders/:id/audit - fetch audit logs for a specific order
router.get(
  "/admin/orders/:id/audit",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const orderId = req.params.id;
      const logs = await (await import("../models/AuditLog.js")).default
        .find({ "meta.orderId": orderId })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();
      res.json({ data: logs });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/orders/:id - get single order (user or admin)
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: "Not found" });
    // allow owner or admin
    if (order.userId.toString() !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

export default router;
