import React from "react";

export default function ProductCard({ product, coupon }) {
  const img =
    (product.images && product.images[0] && product.images[0].url) ||
    "/vite.svg";
  const price =
    (product.variants && product.variants[0] && product.variants[0].price) ||
    "";
  return (
    <div
      className="card"
      style={{
        position: "relative",
        overflow: "hidden",
        transition: "transform .18s",
        borderRadius: 12,
      }}
    >
      {coupon && (
        <div
          className="badge badge-accent"
          style={{ position: "absolute", left: 12, top: 12, zIndex: 10 }}
        >
          {coupon.code} - ₹{(coupon.amount || 0).toFixed(2)}
        </div>
      )}
      <div
        style={{
          width: "100%",
          height: 220,
          overflow: "hidden",
          borderRadius: 10,
        }}
      >
        <img
          src={img}
          alt={product.title}
          className="w-full h-full object-cover img-zoom"
        />
      </div>
      <div style={{ paddingTop: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{product.title}</h3>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>{product.brand}</p>
        <div
          className="mt-3"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800 }}>₹{price}</div>
        </div>
      </div>
    </div>
  );
}
