import React, { useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import { useToast } from "../components/ToastProvider";

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showToast } = useToast();

  const resolveLogo = (logo) => {
    if (!logo) return null;
    if (typeof logo === "string") return logo;

    // recursive search helper to find secure_url or url in nested objects
    const findUrl = (obj, depth = 0) => {
      if (!obj || depth > 5) return null;
      if (typeof obj === "string") return obj;
      if (typeof obj !== "object") return null;
      if (obj.secure_url) return obj.secure_url;
      if (obj.url) return obj.url;
      for (const k of Object.keys(obj)) {
        try {
          const v = obj[k];
          const found = findUrl(v, depth + 1);
          if (found) return found;
        } catch (e) {
          continue;
        }
      }
      return null;
    };

    return findUrl(logo, 0);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/brands");
      const list = res.data.data || res.data || [];
      // normalize logo field so UI always has a string URL
      const normalized = (list || []).map((b) => ({
        ...b,
        logo: resolveLogo(b.logo),
      }));
      setBrands(normalized);
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

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // client-side validations
    if (!file.type || !file.type.startsWith("image/"))
      return showToast("Please select an image file", "error");
    const MAX = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX) return showToast("Image too large (max 3MB)", "error");

    setUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append("image", file);
      // if editing existing brand, inform server to attach logo to that brand
      const target =
        editing && editing._id
          ? `/brands/admin/brands/upload?brandId=${editing._id}`
          : "/brands/admin/brands/upload";
      const res = await api.post(target, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress(pct);
          }
        },
      });

      const url = res?.data?.data?.url || res?.data?.url;
      const publicId =
        res?.data?.data?.raw?.public_id || res?.data?.raw?.public_id;
      const returnedBrand = res?.data?.data?.brand || null;
      if (returnedBrand) {
        // server attached the image to the brand and returned updated brand
        setEditing({ ...returnedBrand });
        showToast("Image uploaded and attached to brand", "success");
      } else if (url) {
        setEditing({ ...editing, logo: url, logoPublicId: publicId });
        showToast("Image uploaded", "success");
      } else {
        showToast("Upload succeeded but no URL returned", "warning");
      }
    } catch (err) {
      console.error(err);
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 400);
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
                <th>Logo</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b._id}>
                  <td style={{ width: 64 }}>
                    {resolveLogo(b.logo) ? (
                      <img
                        src={resolveLogo(b.logo)}
                        alt={b.name}
                        title={b.name}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "#f3f3f3",
                          display: "inline-block",
                          borderRadius: 4,
                        }}
                      />
                    )}
                  </td>
                  <td>{b.name}</td>
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
            <input
              className="input"
              placeholder="Logo URL (https://...)"
              value={editing.logo || ""}
              onChange={(e) => setEditing({ ...editing, logo: e.target.value })}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {uploading || uploadProgress > 0 ? (
                <div style={{ width: 160 }}>
                  <div
                    style={{
                      height: 8,
                      background: "#eee",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: "100%",
                        background: "#3b82f6",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    {uploadProgress}%
                  </div>
                </div>
              ) : null}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              You can paste an image URL or upload an image file. Uploaded
              images are hosted via the server and Cloudinary.
            </div>
            {resolveLogo(editing?.logo) ? (
              <div style={{ marginTop: 8 }}>
                <img
                  src={resolveLogo(editing.logo)}
                  alt="preview"
                  style={{ width: 120, height: 48, objectFit: "cover" }}
                />
              </div>
            ) : null}
            <textarea
              className="input"
              placeholder="Description"
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={save}
                disabled={uploading}
              >
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
