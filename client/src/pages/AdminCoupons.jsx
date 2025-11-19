import React, { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { useConfirm } from "../components/ConfirmProvider";
import { isAuthenticated, getUser } from "../lib/auth";

export default function AdminCoupons() {
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: 0,
    validFrom: "",
    validUntil: "",
    active: true,
  });
  const [testing, setTesting] = useState({ subtotal: 0, code: "" });
  const [testResult, setTestResult] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/coupons");
      setList(res.data.data || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load coupons", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAuthenticated() || getUser()?.role !== "admin") {
    return (
      <div className="app-container">
        <div className="card">Admin access required</div>
      </div>
    );
  }

  const create = async () => {
    // basic client-side validation to avoid server 400 responses
    const code = (form.code || "").trim().toUpperCase();
    if (!code) {
      showToast("Coupon code is required", "error");
      return;
    }
    const value = Number(form.value);
    if (isNaN(value)) {
      showToast("Coupon value must be a number", "error");
      return;
    }
    if (form.type === "percentage") {
      if (value < 0 || value > 100) {
        showToast("Percentage value must be between 0 and 100", "error");
        return;
      }
    } else {
      if (value < 0) {
        showToast("Flat amount must be >= 0", "error");
        return;
      }
    }

    const ok = await confirm({
      title: "Create coupon",
      message: `Create coupon ${code}?`,
    });
    if (!ok) return;

    try {
      const payload = { ...form, code };
      payload.value = value;
      await api.post("/admin/coupons", payload);
      showToast("Coupon created", "success");
      setForm({
        code: "",
        type: "percentage",
        value: 0,
        validFrom: "",
        validUntil: "",
        active: true,
      });
      load();
    } catch (e) {
      console.error(e);
      // surface server validation messages when available
      const msg = e?.response?.data?.error || e?.message || "Create failed";
      if (Array.isArray(msg)) showToast(msg.join("; "), "error");
      else showToast(msg, "error");
    }
  };

  const test = async () => {
    try {
      const res = await api.post("/coupons/validate", {
        code: testing.code,
        subtotal: Number(testing.subtotal || 0),
      });
      setTestResult(res.data.data || res.data);
      showToast("Validation result received", "info");
    } catch (e) {
      console.error(e);
      showToast("Validation failed", "error");
    }
  };

  const remove = async (id) => {
    const ok = await confirm({
      title: "Delete coupon",
      message: "Delete this coupon?",
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      showToast("Deleted", "success");
      load();
    } catch (e) {
      console.error(e);
      showToast("Delete failed", "error");
    }
  };

  const saveEdit = async (c) => {
    try {
      await api.patch(`/admin/coupons/${c._id}`, c);
      showToast("Updated", "success");
      load();
    } catch (e) {
      console.error(e);
      showToast("Update failed", "error");
    }
  };

  return (
    <div className="app-container">
      <h2 className="text-2xl font-semibold mb-4">Admin — Coupons</h2>
      <div className="card mb-4">
        <h3>Create coupon</h3>
        <div
          style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}
        >
          <input
            className="input"
            placeholder="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="percentage">Percentage</option>
            <option value="flat">Flat</option>
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              className="input"
              placeholder="Value"
              type="number"
              min={form.type === "percentage" ? 0 : 0}
              max={form.type === "percentage" ? 100 : undefined}
              value={form.value}
              onChange={(e) =>
                setForm({ ...form, value: Number(e.target.value) })
              }
              style={{ flex: 1 }}
            />
            <div style={{ minWidth: 48, textAlign: "center" }}>
              {form.type === "percentage" ? "%" : "amount"}
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            &nbsp; Active
          </label>
          <input
            className="input"
            type="date"
            value={form.validFrom}
            onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
          />
          <input
            className="input"
            type="date"
            value={form.validUntil}
            onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={create}>
            Create Coupon
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <h3>Existing coupons</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table-modern" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Active</th>
                <th>Valid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <CouponRow
                  key={c._id}
                  coupon={c}
                  onDelete={remove}
                  onSave={saveEdit}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Validate coupon (quick test)</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="input"
            placeholder="Code"
            value={testing.code}
            onChange={(e) => setTesting({ ...testing, code: e.target.value })}
          />
          <input
            className="input"
            placeholder="Subtotal"
            type="number"
            value={testing.subtotal}
            onChange={(e) =>
              setTesting({ ...testing, subtotal: e.target.value })
            }
          />
          <button className="btn" onClick={test}>
            Validate
          </button>
        </div>
        {testResult && (
          <div style={{ marginTop: 8 }}>
            <div>Code: {testResult.code}</div>
            <div>Amount: {testResult.amount}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function CouponRow({ coupon, onDelete, onSave }) {
  const [edit, setEdit] = useState(false);
  const [state, setState] = useState(coupon);
  React.useEffect(() => {
    setState(coupon);
  }, [coupon]);
  return (
    <tr>
      <td style={{ minWidth: 120 }}>
        {edit ? (
          <input
            className="input"
            value={state.code}
            onChange={(e) => setState({ ...state, code: e.target.value })}
          />
        ) : (
          coupon.code
        )}
      </td>
      <td style={{ minWidth: 120 }}>
        {edit ? (
          <select
            className="input"
            value={state.type}
            onChange={(e) => setState({ ...state, type: e.target.value })}
          >
            <option value="percentage">Percentage</option>
            <option value="flat">Flat</option>
          </select>
        ) : (
          coupon.type
        )}
      </td>
      <td>
        {edit ? (
          <input
            className="input"
            type="number"
            value={state.value}
            onChange={(e) =>
              setState({ ...state, value: Number(e.target.value) })
            }
          />
        ) : (
          coupon.value
        )}
      </td>
      <td>
        {edit ? (
          <input
            type="checkbox"
            checked={!!state.active}
            onChange={(e) => setState({ ...state, active: e.target.checked })}
          />
        ) : coupon.active ? (
          "Yes"
        ) : (
          "No"
        )}
      </td>
      <td style={{ minWidth: 200 }}>
        {(coupon.validFrom
          ? new Date(coupon.validFrom).toLocaleDateString()
          : "") +
          (coupon.validUntil
            ? " - " + new Date(coupon.validUntil).toLocaleDateString()
            : "")}
      </td>
      <td>
        <div style={{ display: "flex", gap: 8 }}>
          {edit ? (
            <button
              className="btn btn-xs"
              onClick={() => {
                onSave(state);
                setEdit(false);
              }}
            >
              Save
            </button>
          ) : (
            <button className="btn btn-xs" onClick={() => setEdit(true)}>
              Edit
            </button>
          )}
          <button
            className="btn btn-xs btn-outline"
            onClick={() => onDelete(coupon._id)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
