import React, { useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { useConfirm } from "../components/ConfirmProvider";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load users", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    const ok = await confirm({
      title: "Delete user",
      message: "Delete this user?",
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showToast("Deleted", "success");
      load();
    } catch (e) {
      console.error(e);
      showToast("Delete failed", "error");
    }
  };

  const toggleAdmin = async (u) => {
    const ok = await confirm({
      title: "Change role",
      message: `Change role for ${u.email} to ${
        u.role === "admin" ? "user" : "admin"
      }?`,
    });
    if (!ok) return;
    try {
      await api.put(`/admin/users/${u._id}`, {
        role: u.role === "admin" ? "user" : "admin",
      });
      showToast("Updated", "success");
      load();
    } catch (e) {
      console.error(e);
      showToast("Update failed", "error");
    }
  };

  const [editingUser, setEditingUser] = useState(null);

  const startEdit = async (id) => {
    try {
      const res = await api.get(`/admin/users/${id}`);
      const u = (res.data && res.data.data) || res.data;
      setEditingUser(u);
    } catch (e) {
      console.error(e);
      showToast("Failed to load user", "error");
    }
  };

  const saveUser = async () => {
    if (!editingUser) return;
    try {
      const payload = {
        name: editingUser.name,
        phone: editingUser.phone,
        role: editingUser.role,
        addresses: editingUser.addresses,
      };
      await api.put(`/admin/users/${editingUser._id}`, payload);
      showToast("Saved", "success");
      setEditingUser(null);
      load();
    } catch (e) {
      console.error(e);
      showToast("Save failed", "error");
    }
  };

  return (
    <div className="app-container">
      <div className="header-flex flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Users</h2>
      </div>
      <div className="card">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table-modern" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>{u.role}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-xs"
                        onClick={() => toggleAdmin(u)}
                      >
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button
                        className="btn btn-xs"
                        onClick={() => startEdit(u._id)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => remove(u._id)}
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
      {editingUser && (
        <div className="card mt-4">
          <h3>Edit user</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <label className="block text-sm">Name</label>
              <input
                className="input"
                value={editingUser.name || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm">Phone</label>
              <input
                className="input"
                value={editingUser.phone || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm">Role</label>
              <select
                className="input"
                value={editingUser.role || "user"}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={saveUser}>
                Save
              </button>
              <button className="btn" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
