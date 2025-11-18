import React, { useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import { useToast } from "../components/ToastProvider";

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/brands");
      setBrands(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load brands", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      // simple client-side duplicate check (case-insensitive)
      const name = (editing.name || "").trim();
      if (!name) return showToast("Name is required", "error");
      const dup = brands.find(
        (b) =>
          b.name &&
          b.name.toLowerCase() === name.toLowerCase() &&
          b._id !== editing._id
      );
      if (dup) return showToast("Brand already exists", "error");

      if (editing._id) {
        await api.put(`/brands/admin/brands/${editing._id}`, editing);
        showToast("Updated", "success");
      } else {
        await api.post("/brands/admin/brands", editing);
        showToast("Created", "success");
      }
      setEditing(null);
      load();
    } catch (err) {
      console.error(err);
      // surface server message when available (e.g. 409 conflict)
      const msg = err?.response?.data?.error || err?.message || "Save failed";
      showToast(msg, "error");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete brand?")) return;
    try {
      await api.delete(`/brands/admin/brands/${id}`);
      showToast("Deleted", "success");
      load();
    } catch (e) {
      console.error(e);
      showToast("Delete failed", "error");
    }
  };

  return (
    <div className="app-container">
      <div className="header-flex flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Brands</h2>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => setEditing({ name: "" })}
          >
            New Brand
          </button>
        </div>
      </div>

      <div className="card mb-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table-modern" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b._id}>
                  <td>{b.name}</td>
                  <td>{b.slug}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-xs"
                        onClick={() => setEditing(b)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => remove(b._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="card">
          <h3>{editing._id ? "Edit Brand" : "New Brand"}</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              className="input"
              placeholder="Name"
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <textarea
              className="input"
              placeholder="Description"
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={save}>
                Save
              </button>
              <button className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
