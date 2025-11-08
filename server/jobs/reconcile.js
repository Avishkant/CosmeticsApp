import { razorInstance } from "../services/razorpay.js";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";

// Reconcile pending Razorpay orders every N minutes
export function startReconcileJob({ intervalMs = 1000 * 60 * 5 } = {}) {
  if (!razorInstance) {
    console.warn("Razorpay not configured; reconcile job will not run");
    return;
  }

  const run = async () => {
    try {
      const pendingOrders = await Order.find({
        status: "pending",
        "payment.provider": "razorpay",
        "payment.meta.razorpayOrderId": { $exists: true },
      }).limit(50);
      for (const order of pendingOrders) {
        const rpId = order.payment.meta.razorpayOrderId;
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
          console.error("Reconcile: error fetching payments for", rpId, e);
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
            action: "auto_reconcile",
            resource: "order",
            meta: {
              orderId: order._id.toString(),
              razorpayOrderId: rpId,
              paymentId: captured.id,
              status: captured.status,
            },
          });
          console.log("Reconciled order", order._id.toString());
        }
      }
    } catch (e) {
      console.error("Reconcile job error", e);
    }
  };

  // run immediately and then on interval
  run();
  const id = setInterval(run, intervalMs);
  return () => clearInterval(id);
}
