import React, { useEffect, useState } from "react";
import api, { reconcileOrder } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { useConfirm } from "../components/ConfirmProvider";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedAudit, setSelectedAudit] = useState([]);
  const [, setLoading] = useState(false);
  const showToast = useToast().showToast;
  const confirm = useConfirm();

  const load = React.useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const res = await api.get("/admin/orders", {
          params: {
            page: p,
            limit,
            status: statusFilter || undefined,
            q: q || undefined,
          },
        });
        setOrders(res.data.data || res.data || []);
        if (res.data.meta) {
          setPage(res.data.meta.page);
          setLimit(res.data.meta.limit);
          setTotal(res.data.meta.total);
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to load orders", "error");
      }
      setLoading(false);
    },
    [page, limit, statusFilter, q, showToast]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const handleReconcile = async (id) => {
    try {
      await reconcileOrder(id);
      showToast("Reconciled", "success");
      load();
    } catch (e) {
      console.error(e);
      showToast("Reconcile failed", "error");
    }
  };

  const handleBulkReconcile = async () => {
    if (selected.size === 0) return showToast("No orders selected", "error");
    const ids = Array.from(selected);
    const ok = await confirm({
      title: "Confirm bulk reconcile",
      message: `Reconcile ${ids.length} orders?`,
    });
    if (!ok) return;
    try {
      const res = await api.post("/admin/orders/reconcile-bulk", { ids });
      showToast("Bulk reconcile completed", "success");
      setSelected(new Set());
      load();
      console.log(res.data);
    } catch (e) {
      console.error(e);
      showToast("Bulk reconcile failed", "error");
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (q) params.set("q", q);
    const url = `${api.defaults.baseURL.replace(
      "/api",
      ""
    )}/api/admin/orders/export?${params.toString()}`;
    window.open(url, "_blank");
  };

  const loadAudit = async (orderId) => {
    try {
      const res = await api.get(`/admin/orders/${orderId}/audit`);
      setSelectedAudit(res.data.data || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load audit", "error");
    }
  };

  return (
    <div className="app-container animate-fadeInUp">
      <div className="header-flex flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Admin Orders</h2>
        <div className="flex gap-2 items-center">
          <button onClick={handleBulkReconcile} className="btn btn-primary">
            Bulk Reconcile
          </button>
          <button onClick={handleExport} className="btn btn-outline">
            Export CSV
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex gap-3 items-center">
          <input
            className="input flex-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order id or razorpayOrderId"
          />
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={() => load(1)} className="btn">
            Filter
          </button>
        </div>
      </div>

      <div className="table-wrapper card-lg mb-4">
        <table className="table-modern">
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th>Order</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(o._id)}
                    onChange={(e) => {
                      const s = new Set(selected);
                      if (e.target.checked) s.add(o._id);
                      else s.delete(o._id);
                      setSelected(s);
                    }}
                  />
                </td>
                <td style={{ minWidth: 220 }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong className="text-sm">{o._id}</strong>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {o.customerEmail || (o.user && o.user.email) || "—"}
                    </span>
                  </div>
                </td>
                <td>
                  {o.status === "paid" ? (
                    <span className="badge badge-success">Paid</span>
                  ) : o.status === "failed" ? (
                    <span className="badge badge-danger">Failed</span>
                  ) : (
                    <span className="badge">{o.status}</span>
                  )}
                </td>
                <td>₹{(o.total || 0).toFixed(2)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {new Date(o.createdAt).toLocaleString()}
                </td>
                <td>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <button
                      onClick={() => handleReconcile(o._id)}
                      className="btn btn-outline"
                    >
                      Reconcile
                    </button>
                    <a className="btn btn-ghost" href={`/orders/${o._id}`}>
                      View
                    </a>
                    <button onClick={() => loadAudit(o._id)} className="btn">
                      Audit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile friendly cards */}
      <div className="orders-list">
        {orders.map((o) => (
          <div key={o._id} className="order-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{o._id}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                {o.status === "paid" ? (
                  <span className="badge badge-success">Paid</span>
                ) : (
                  <span className="badge">{o.status}</span>
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ color: "var(--muted)" }}>Total</div>
              <div style={{ fontWeight: 700 }}>
                ₹{(o.total || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleReconcile(o._id)}
                className="btn btn-outline"
              >
                Reconcile
              </button>
              <a className="btn btn-ghost" href={`/orders/${o._id}`}>
                View
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          disabled={page <= 1}
          onClick={() => {
            setPage((p) => Math.max(1, p - 1));
            load(page - 1);
          }}
          className="btn"
        >
          Prev
        </button>
        <div>
          Page {page} (Total {total})
        </div>
        <button
          disabled={orders.length < limit}
          onClick={() => {
            setPage((p) => p + 1);
            load(page + 1);
          }}
          className="btn"
        >
          Next
        </button>
      </div>

      {selectedAudit.length > 0 && (
        <div className="mt-6 card">
          <h3 className="font-medium">Audit for selected order</h3>
          <ul className="mt-2" style={{ display: "grid", gap: 8 }}>
            {selectedAudit.map((l) => (
              <li key={l._id} className="card">
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {new Date(l.createdAt).toLocaleString()} —{" "}
                  <strong>{l.action}</strong>
                </div>
                <pre
                  style={{ fontSize: 12, marginTop: 6, whiteSpace: "pre-wrap" }}
                >
                  {JSON.stringify(l.meta, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
