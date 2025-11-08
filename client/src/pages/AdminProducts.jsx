import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { useConfirm } from "../components/ConfirmProvider";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // product being edited
  const [page] = useState(1);
  const [limit] = useState(50);
  const [stockPreview, setStockPreview] = useState(null);
  const [stockFile, setStockFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const dragIndexRef = useRef(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products", { params: { page, limit } });
      const list = (res.data && res.data.data) || res.data || [];
      setProducts(list || []);
    } catch (e) {
      console.error("Failed to load products", e);
      showToast("Failed to load products", "error");
    }
    setLoading(false);
  }, [page, limit, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (p) => {
    // clone to avoid mutating list
    const copy = JSON.parse(JSON.stringify(p));
    // ensure variants array exists and prepare attributes for UI
    copy.variants = (copy.variants || []).map((v) => ({
      ...v,
      attributesArray: Object.entries(v.attributes || {}).map(([k, val]) => ({
        key: k,
        value: val,
      })),
    }));
    setEditing(copy);
  };

  const saveEdit = async () => {
    if (!editing) return;
    // validation: block save if errors
    if (Object.keys(validationErrors || {}).length > 0) {
      showToast("Please fix validation errors before saving", "error");
      return;
    }
    try {
      // prepare variants for server (convert attributesArray -> attributes object)
      const variants = (editing.variants || []).map((v) => ({
        name: v.name,
        sku: v.sku,
        mrp: v.mrp ? Number(v.mrp) : undefined,
        price: v.price ? Number(v.price) : undefined,
        stock: v.stock ? Number(v.stock) : 0,
        attributes: Object.fromEntries(
          (v.attributesArray || [])
            .filter((a) => a.key)
            .map((a) => [a.key, a.value])
        ),
      }));

      const payload = {
        title: editing.title,
        description: editing.description,
        brand: editing.brand,
        variants,
        images: (editing.images || []).map((img, i) => ({
          url: img.url,
          alt: img.alt || "",
          order: i + 1,
        })),
      };

      // send update
      await api.put(`/products/${editing._id}`, payload);
      showToast("Saved", "success");
      setEditing(null);
      load();
    } catch (e) {
      console.error(e);
      showToast("Save failed", "error");
    }
  };

  const deleteProduct = async (id) => {
    const ok = await confirm({
      title: "Delete product",
      message: "Delete this product?",
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);
      showToast("Deleted", "success");
      load();
    } catch (e) {
      console.error(e);
      showToast("Delete failed", "error");
    }
  };

  const handleImageUpload = async (prodId, files) => {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    for (const f of files) fd.append("images", f);
    try {
      await api.post(`/products/${prodId}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Uploaded", "success");
      // refresh list and editing product if open
      load();
      if (editing && editing._id === prodId) {
        try {
          const res = await api.get(`/products/${prodId}`);
          const prod = (res.data && res.data.data) || res.data;
          if (prod) {
            const copy = JSON.parse(JSON.stringify(prod));
            copy.variants = (copy.variants || []).map((v) => ({
              ...v,
              attributesArray: Object.entries(v.attributes || {}).map(
                ([k, val]) => ({ key: k, value: val })
              ),
            }));
            copy.images = copy.images || [];
            setEditing(copy);
          }
        } catch (err) {
          console.error("Failed to refresh product after upload", err);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Upload failed", "error");
    }
  };

  // Drag handlers for images
  const handleDragStart = (e, idx) => {
    dragIndexRef.current = idx;
    if (e && e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from == null || !editing) return;
    if (from === idx) {
      dragIndexRef.current = null;
      return;
    }
    const copy = { ...editing };
    copy.images = copy.images || [];
    const [moved] = copy.images.splice(from, 1);
    copy.images.splice(idx, 0, moved);
    setEditing(copy);
    dragIndexRef.current = null;
  };
  const handleDragOver = (e) => e.preventDefault();

  // Validation for editing product (variants)
  const validateEditing = (ed) => {
    const out = {};
    if (!ed || !ed.variants) return out;
    const seen = {};
    ed.variants.forEach((v, idx) => {
      const msgs = [];
      const sku = (v.sku || "").trim();
      if (sku) {
        if (seen[sku]) msgs.push("Duplicate SKU");
        else seen[sku] = true;
      }
      if (v.price !== undefined && v.price !== "" && isNaN(Number(v.price)))
        msgs.push("Price must be a number");
      if (v.mrp !== undefined && v.mrp !== "" && isNaN(Number(v.mrp)))
        msgs.push("MRP must be a number");
      if (
        v.stock !== undefined &&
        (isNaN(Number(v.stock)) || Number(v.stock) < 0)
      )
        msgs.push("Stock must be >= 0");
      if (msgs.length) out[`v${idx}`] = msgs.join("; ");
    });
    return out;
  };

  useEffect(() => {
    setValidationErrors(validateEditing(editing));
  }, [editing]);

  return (
    <div className="app-container">
      <h2 className="text-2xl font-semibold mb-4">Admin — Products</h2>
      <div className="card mb-4">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>Products ({products.length})</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={async () => {
                // create a new minimal product and open editor
                try {
                  const title = `New product ${Date.now()}`;
                  const slug =
                    title.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
                    "-" +
                    Date.now();
                  const res = await api.post("/products", { title, slug });
                  const prod = (res.data && res.data.data) || res.data;
                  if (prod) {
                    // prepare for editing
                    const copy = JSON.parse(JSON.stringify(prod));
                    copy.variants = (copy.variants || []).map((v) => ({
                      ...v,
                      attributesArray: Object.entries(v.attributes || {}).map(
                        ([k, val]) => ({ key: k, value: val })
                      ),
                    }));
                    copy.images = copy.images || [];
                    setEditing(copy);
                    load();
                  }
                } catch (err) {
                  console.error(err);
                  showToast("Create failed", "error");
                }
              }}
            >
              Create product
            </button>
            <a
              className="btn btn-outline"
              href="/api/admin/products/stocks/export"
            >
              Export Stocks
            </a>
            <label className="btn btn-outline" style={{ cursor: "pointer" }}>
              Import Stocks
              <input
                type="file"
                accept="text/csv"
                style={{ display: "none" }}
                onChange={(e) =>
                  setStockFile(e.target.files && e.target.files[0])
                }
              />
            </label>
            <button
              className="btn"
              onClick={async () => {
                if (!stockFile) {
                  showToast("Select a CSV file first (Import Stocks)", "error");
                  return;
                }
                try {
                  const fd = new FormData();
                  fd.append("file", stockFile);
                  const res = await api.post(
                    "/admin/products/stocks/import?dryRun=true",
                    fd,
                    { headers: { "Content-Type": "multipart/form-data" } }
                  );
                  const data = (res.data && res.data.data) || res.data;
                  setStockPreview(data);
                  showToast("Preview completed — see results below", "info");
                } catch (err) {
                  console.error(err);
                  showToast("Preview failed", "error");
                }
              }}
            >
              Preview Stocks
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (!stockFile) {
                  showToast("Select a CSV file first (Import Stocks)", "error");
                  return;
                }
                (async () => {
                  const ok = await confirm({
                    title: "Apply stock updates",
                    message:
                      "Apply stock updates from CSV? This will modify product stocks.",
                  });
                  if (!ok) return;
                  try {
                    const fd = new FormData();
                    fd.append("file", stockFile);
                    const res = await api.post(
                      "/admin/products/stocks/import",
                      fd,
                      { headers: { "Content-Type": "multipart/form-data" } }
                    );
                    const data = (res.data && res.data.data) || res.data;
                    setStockPreview(data);
                    showToast("Import completed", "success");
                    load();
                  } catch (err) {
                    console.error(err);
                    showToast("Import failed", "error");
                  }
                })();
              }}
            >
              Apply Stocks
            </button>
            <a className="btn btn-ghost" href="/admin-upload">
              Import CSV
            </a>
          </div>
        </div>
      </div>

      {stockPreview && (
        <div className="card mb-4">
          <h3>Stock Import Results {stockPreview.dryRun ? "(preview)" : ""}</h3>
          <div>Updated: {stockPreview.updated}</div>
          <div>Errors/Rows: {stockPreview.errors}</div>
          {stockPreview.details && stockPreview.details.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Details (first {Math.min(200, stockPreview.details.length)})
              </div>
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                <table className="table-modern" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>#</th>
                      <th>SKU</th>
                      <th>Variant SKU</th>
                      <th>Old</th>
                      <th>New</th>
                      <th>Status</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockPreview.details.slice(0, 200).map((d, i) => {
                      const row = d.row || {};
                      const rowNumber =
                        d.rowNumber || row.__rowNum__ || i + 2 || i + 1;
                      const sku = d.sku || row.sku || row.SKU || "";
                      const variantSku =
                        d.variantSku ||
                        row.variantSku ||
                        row.variant_sku ||
                        row.sku_variant ||
                        "";
                      const oldStock =
                        typeof d.oldStock !== "undefined"
                          ? d.oldStock
                          : row.oldStock || "";
                      const newStock =
                        typeof d.newStock !== "undefined"
                          ? d.newStock
                          : row.stock || row.Stock || "";
                      const status = d.error
                        ? "Error"
                        : d.info
                        ? "Preview"
                        : "OK";
                      const message = d.error || d.info || "";
                      const statusColor =
                        status === "Error"
                          ? "#e3342f"
                          : status === "Preview"
                          ? "#f59e0b"
                          : "#16a34a";
                      return (
                        <tr
                          key={i}
                          style={{
                            background: d.error
                              ? "rgba(227,52,47,0.04)"
                              : d.info
                              ? "rgba(245,158,11,0.04)"
                              : "transparent",
                          }}
                        >
                          <td>{rowNumber}</td>
                          <td>{sku}</td>
                          <td>{variantSku}</td>
                          <td>{oldStock}</td>
                          <td>{newStock}</td>
                          <td style={{ color: statusColor, fontWeight: 600 }}>
                            {status}
                          </td>
                          <td style={{ maxWidth: 400, whiteSpace: "pre-wrap" }}>
                            {message}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card-lg table-wrapper">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Title</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <img
                      src={
                        (p.images && p.images[0] && p.images[0].url) ||
                        "/vite.svg"
                      }
                      alt=""
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  </td>
                  <td style={{ minWidth: 240 }}>
                    <div style={{ fontWeight: 700 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {p.description && p.description.slice(0, 120)}
                    </div>
                  </td>
                  <td>{p.brand}</td>
                  <td>
                    ₹
                    {(p.variants &&
                      p.variants[0] &&
                      (p.variants[0].price || p.variants[0].mrp)) ||
                      "—"}
                  </td>
                  <td>
                    {(p.variants &&
                      p.variants.reduce((s, v) => s + (v.stock || 0), 0)) ||
                      0}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <label
                        className="btn btn-outline"
                        style={{ cursor: "pointer" }}
                      >
                        Upload
                        <input
                          type="file"
                          multiple
                          style={{ display: "none" }}
                          onChange={(e) =>
                            handleImageUpload(p._id, e.target.files)
                          }
                        />
                      </label>
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          window.location.href = `/product/${p.slug || p._id}`;
                        }}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => deleteProduct(p._id)}
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
        <div className="card-lg" style={{ marginTop: 16 }}>
          <h3>Edit product</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 320px",
              gap: 12,
            }}
          >
            <div>
              <div className="mt-2">
                <label className="block text-sm font-medium">Title</label>
                <input
                  className="input w-full"
                  value={editing.title || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  className="input w-full"
                  rows={6}
                  value={editing.description || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium">Brand</label>
                <input
                  className="input w-full"
                  value={editing.brand || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, brand: e.target.value })
                  }
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium">Images</label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  {(editing.images || []).map((img, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                      style={{
                        width: 120,
                        border: "1px solid var(--muted)",
                        padding: 6,
                        borderRadius: 6,
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.alt || ""}
                        style={{
                          width: "100%",
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                      />
                      <input
                        className="input"
                        style={{ marginTop: 6 }}
                        value={img.alt || ""}
                        onChange={(e) => {
                          const copy = { ...editing };
                          copy.images = copy.images || [];
                          copy.images[idx].alt = e.target.value;
                          setEditing(copy);
                        }}
                        placeholder="alt text"
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button
                          className="btn btn-xs"
                          onClick={() => {
                            const copy = { ...editing };
                            copy.images = copy.images || [];
                            if (idx > 0) {
                              const tmp = copy.images[idx - 1];
                              copy.images[idx - 1] = copy.images[idx];
                              copy.images[idx] = tmp;
                              setEditing(copy);
                            }
                          }}
                        >
                          ↑
                        </button>
                        <button
                          className="btn btn-xs"
                          onClick={() => {
                            const copy = { ...editing };
                            copy.images = copy.images || [];
                            if (idx < copy.images.length - 1) {
                              const tmp = copy.images[idx + 1];
                              copy.images[idx + 1] = copy.images[idx];
                              copy.images[idx] = tmp;
                              setEditing(copy);
                            }
                          }}
                        >
                          ↓
                        </button>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => {
                            (async () => {
                              if (!editing || !editing._id) {
                                const copy = { ...editing };
                                copy.images = copy.images || [];
                                copy.images.splice(idx, 1);
                                setEditing(copy);
                                return;
                              }
                              try {
                                await api.delete(
                                  `/products/${editing._id}/images`,
                                  { data: { url: img.url } }
                                );
                                showToast("Image deleted", "success");
                                const r = await api.get(
                                  `/products/${editing._id}`
                                );
                                const prod = (r.data && r.data.data) || r.data;
                                if (prod) {
                                  const copy = JSON.parse(JSON.stringify(prod));
                                  copy.variants = (copy.variants || []).map(
                                    (v) => ({
                                      ...v,
                                      attributesArray: Object.entries(
                                        v.attributes || {}
                                      ).map(([k, val]) => ({
                                        key: k,
                                        value: val,
                                      })),
                                    })
                                  );
                                  setEditing(copy);
                                  load();
                                }
                              } catch (err) {
                                console.error(err);
                                showToast("Failed to delete image", "error");
                              }
                            })();
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          marginTop: 6,
                        }}
                      >
                        Order: {idx + 1}
                      </div>
                    </div>
                  ))}
                  <label
                    className="btn btn-outline"
                    style={{
                      cursor: "pointer",
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    Upload
                    <input
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        if (!editing || !editing._id) {
                          showToast(
                            "Save product first (create) before uploading images",
                            "error"
                          );
                          return;
                        }
                        handleImageUpload(editing._id, files);
                      }}
                    />
                  </label>
                  <button
                    className="btn btn-sm"
                    style={{ marginLeft: 6 }}
                    onClick={async () => {
                      if (!editing || !editing._id)
                        return showToast("No product selected", "error");
                      try {
                        const imgs = (editing.images || []).map((im, i) => ({
                          url: im.url,
                          alt: im.alt || "",
                          order: i + 1,
                        }));
                        await api.patch(`/products/${editing._id}/images`, {
                          images: imgs,
                        });
                        showToast("Images saved", "success");
                        // refresh product
                        const r = await api.get(`/products/${editing._id}`);
                        const prod = (r.data && r.data.data) || r.data;
                        if (prod) {
                          const copy = JSON.parse(JSON.stringify(prod));
                          copy.variants = (copy.variants || []).map((v) => ({
                            ...v,
                            attributesArray: Object.entries(
                              v.attributes || {}
                            ).map(([k, val]) => ({ key: k, value: val })),
                          }));
                          setEditing(copy);
                          load();
                        }
                      } catch (err) {
                        console.error(err);
                        showToast("Failed to save images", "error");
                      }
                    }}
                  >
                    Save images
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={async () => {
                      if (!editing || !editing._id) {
                        showToast(
                          "Save product first (create) before saving images",
                          "error"
                        );
                        return;
                      }
                      try {
                        const imagesPayload = (editing.images || []).map(
                          (img, i) => ({
                            url: img.url,
                            alt: img.alt || "",
                            order: i + 1,
                          })
                        );
                        await api.patch(`/products/${editing._id}/images`, {
                          images: imagesPayload,
                        });
                        showToast("Images saved", "success");
                        // refresh product
                        const res = await api.get(`/products/${editing._id}`);
                        const prod = (res.data && res.data.data) || res.data;
                        if (prod) {
                          const copy = JSON.parse(JSON.stringify(prod));
                          copy.variants = (copy.variants || []).map((v) => ({
                            ...v,
                            attributesArray: Object.entries(
                              v.attributes || {}
                            ).map(([k, val]) => ({ key: k, value: val })),
                          }));
                          copy.images = copy.images || [];
                          setEditing(copy);
                        }
                      } catch (err) {
                        console.error(err);
                        showToast("Failed to save images", "error");
                      }
                    }}
                  >
                    Save images
                  </button>
                </div>
              </div>
            </div>
            <div>
              <div className="card p-3">
                <div style={{ fontWeight: 700 }}>Variants</div>
                {(editing.variants || []).map((v, idx) => (
                  <div key={idx} style={{ marginTop: 8 }} className="">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div className="text-xs text-muted">
                        {v.name || v.sku || "Variant " + (idx + 1)}
                      </div>
                      <div>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => {
                            const copy = { ...editing };
                            copy.variants = copy.variants || [];
                            copy.variants.splice(idx, 1);
                            setEditing(copy);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      <input
                        className="input"
                        value={v.name || ""}
                        onChange={(e) => {
                          const copy = { ...editing };
                          copy.variants[idx].name = e.target.value;
                          setEditing(copy);
                        }}
                        placeholder="Variant name (e.g. 50ml, Red)"
                      />
                      <input
                        className="input"
                        value={v.sku || ""}
                        onChange={(e) => {
                          const copy = { ...editing };
                          copy.variants[idx].sku = e.target.value;
                          setEditing(copy);
                        }}
                        placeholder="SKU"
                      />

                      <input
                        className="input"
                        value={v.mrp || ""}
                        onChange={(e) => {
                          const copy = { ...editing };
                          copy.variants[idx].mrp = e.target.value;
                          setEditing(copy);
                        }}
                        placeholder="MRP"
                      />
                      <input
                        className="input"
                        value={v.price || ""}
                        onChange={(e) => {
                          const copy = { ...editing };
                          copy.variants[idx].price = e.target.value;
                          setEditing(copy);
                        }}
                        placeholder="Price"
                      />

                      <input
                        className="input"
                        value={v.stock || 0}
                        onChange={(e) => {
                          const copy = { ...editing };
                          copy.variants[idx].stock = Number(e.target.value);
                          setEditing(copy);
                        }}
                        placeholder="Stock"
                      />
                      <div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            Attributes
                          </div>
                          <button
                            className="btn btn-xs"
                            onClick={() => {
                              const copy = { ...editing };
                              copy.variants[idx].attributesArray =
                                copy.variants[idx].attributesArray || [];
                              copy.variants[idx].attributesArray.push({
                                key: "",
                                value: "",
                              });
                              setEditing(copy);
                            }}
                          >
                            + Add
                          </button>
                        </div>
                        {(v.attributesArray || []).map((a, aidx) => (
                          <div
                            key={aidx}
                            style={{ display: "flex", gap: 6, marginTop: 6 }}
                          >
                            <input
                              className="input"
                              style={{ width: 120 }}
                              value={a.key}
                              onChange={(e) => {
                                const copy = { ...editing };
                                copy.variants[idx].attributesArray[aidx].key =
                                  e.target.value;
                                setEditing(copy);
                              }}
                              placeholder="key"
                            />
                            <input
                              className="input"
                              style={{ width: "100%" }}
                              value={a.value}
                              onChange={(e) => {
                                const copy = { ...editing };
                                copy.variants[idx].attributesArray[aidx].value =
                                  e.target.value;
                                setEditing(copy);
                              }}
                              placeholder="value"
                            />
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() => {
                                const copy = { ...editing };
                                copy.variants[idx].attributesArray.splice(
                                  aidx,
                                  1
                                );
                                setEditing(copy);
                              }}
                            >
                              x
                            </button>
                          </div>
                        ))}
                        {validationErrors && validationErrors[`v${idx}`] && (
                          <div
                            style={{
                              color: "var(--danger)",
                              fontSize: 12,
                              marginTop: 6,
                            }}
                          >
                            {validationErrors[`v${idx}`]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <button
                    className="btn"
                    onClick={() => {
                      const copy = { ...editing };
                      copy.variants = copy.variants || [];
                      copy.variants.push({
                        name: "",
                        sku: "",
                        mrp: "",
                        price: "",
                        stock: 0,
                        attributesArray: [],
                      });
                      setEditing(copy);
                    }}
                  >
                    + Add variant
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={saveEdit}>
                  Save
                </button>
                <button className="btn" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
