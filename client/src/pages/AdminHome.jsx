import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getUser } from "../lib/auth";

export default function AdminHome() {
  const navigate = useNavigate();
  const user = getUser();
  if (!isAuthenticated() || user?.role !== "admin") {
    return (
      <div className="app-container">
        <h2 className="text-2xl">Admin</h2>
        <div className="card">You must be an admin to view this page.</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header-flex flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/admin/products")}
          >
            Manage Products
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        <Link to="/admin/products" className="card hover-card">
          <div style={{ fontWeight: 700 }}>Products</div>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            Create, edit and manage product images, variants and stocks.
          </div>
        </Link>

        <Link to="/admin/orders" className="card hover-card">
          <div style={{ fontWeight: 700 }}>Orders</div>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            View and manage customer orders, reconcile payments.
          </div>
        </Link>

        <Link to="/admin/payments" className="card hover-card">
          <div style={{ fontWeight: 700 }}>Payments</div>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            Reconcile payments and audit logs.
          </div>
        </Link>

        <Link to="/admin-upload" className="card hover-card">
          <div style={{ fontWeight: 700 }}>Data Upload</div>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            Import products/stocks from CSV and bulk upload assets.
          </div>
        </Link>
      </div>

      <div className="card mt-4">
        <h3 style={{ marginBottom: 8 }}>Quick actions</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => navigate("/admin/products")}>
            Open Products
          </button>
          <button className="btn" onClick={() => navigate("/admin/products")}>
            Create Product
          </button>
          <button className="btn" onClick={() => navigate("/admin/orders")}>
            Open Orders
          </button>
          <button className="btn" onClick={() => navigate("/admin/payments")}>
            Open Payments
          </button>
        </div>
      </div>
    </div>
  );
}
