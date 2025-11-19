import React, { useState, useEffect } from "react";
import { reconcileOrder, fetchAuditLogs } from "../lib/api";
import api from "../lib/api";
import { useToast } from "../components/ToastProvider";

export default function AdminPayments() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const { showToast } = useToast();

  const handleReconcile = async (id) => {
    const oid = id || orderId;
    if (!oid) return;
    try {
      const res = await reconcileOrder(oid);
      setResult(res);
      showToast("Reconciliation finished", "success");
      await loadOrders();
    } catch (e) {
      console.error(e);
      showToast(e.response?.data?.error || "Reconcile failed", "error");
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetchAuditLogs();
      setLogs(res || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load logs", "error");
    }
  };

  const loadOrders = React.useCallback(async () => {
    try {
      const res = await api.get("/admin/orders");
      // server returns { data: [...], meta: {...} }
      setOrders(res.data?.data || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load orders", "error");
    }
  }, [showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">
        Admin Payments / Reconciliation
      </h2>
      <div className="mb-4 flex gap-2">
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Order id"
          className="border p-2 rounded flex-1"
        />
        <button
          onClick={() => handleReconcile()}
          className="bg-indigo-600 text-white px-3 py-2 rounded"
        >
          Reconcile
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-2">Recent Orders</h3>
        <ul className="space-y-2">
          {orders.map((o) => (
            <li
              key={o._id}
              className="border p-3 rounded flex items-center justify-between"
            >
              <div>
                <div className="font-semibold">{o._id}</div>
                <div className="text-sm text-gray-600">
                  Status: {o.status} — Total: ₹{(o.total || 0).toFixed(2)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReconcile(o._id)}
                  className="bg-gray-200 px-3 py-1 rounded"
                >
                  Reconcile
                </button>
                <a
                  className="text-sm text-indigo-600"
                  href={`/orders/${o._id}`}
                >
                  View
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {result && (
        <div className="mb-4 border p-4 rounded">
          <h3 className="font-medium">Result</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <h3 className="font-medium">Audit logs</h3>
        <div className="mt-2 mb-2">
          <button onClick={loadLogs} className="bg-gray-200 px-3 py-2 rounded">
            Load logs
          </button>
        </div>
        <ul className="space-y-2">
          {logs.map((l) => (
            <li key={l._id} className="border p-2 rounded">
              <div className="text-sm text-gray-700">
                {new Date(l.createdAt).toLocaleString()} —{" "}
                <strong>{l.action}</strong>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {JSON.stringify(l.meta)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
