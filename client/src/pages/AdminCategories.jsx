import React, { useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import { useToast } from "../components/ToastProvider";

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setItems(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load categories", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      if (editing._id) {
        await api.put(`/categories/admin/categories/${editing._id}`, editing);
        showToast("Updated", "success");
      } else {
        await api.post("/categories/admin/categories", editing);
        showToast("Created", "success");
      }
      setEditing(null);
      load();
    } catch (err) {
      console.error(err);
      showToast("Save failed", "error");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete category?")) return;
    try {
      await api.delete(`/categories/admin/categories/${id}`);
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
        <h2 className="text-2xl font-semibold">Categories</h2>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => setEditing({ name: "" })}
          >
            New Category
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
              {items.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.slug}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-xs"
                        onClick={() => setEditing(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => remove(c._id)}
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
          <h3>{editing._id ? "Edit Category" : "New Category"}</h3>
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
