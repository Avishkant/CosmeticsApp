import React, { useState } from "react";
import {
  addToWishlist,
  removeFromWishlist,
  addToCart as apiAddToCart,
} from "../lib/api";
import { useCart } from "../contexts/CartContext";
import { isAuthenticated } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";

export default function ProductCard({ product, coupon }) {
  const img =
    (product.images && product.images[0] && product.images[0].url) ||
    "/vite.svg";
  const price =
    (product.variants && product.variants[0] && product.variants[0].price) ||
    "";
  const [wished, setWished] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { addItem } = useCart() || {};

  const handleAddToCart = async (e) => {
    e && e.preventDefault();
    e && e.stopPropagation();
    if (!isAuthenticated()) return navigate("/login");
    try {
      const variant = (product.variants && product.variants[0]) || {};
      const payload = {
        productId: product._id,
        variantId: variant.variantId || variant._id,
        qty: 1,
        price: variant.price || 0,
      };
      if (typeof addItem === "function") {
        await addItem(payload);
      } else {
        await apiAddToCart(payload);
      }
      showToast("Added to cart", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add to cart", "error");
    }
  };

  const toggleWish = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated()) return navigate("/login");
    try {
      if (!wished) {
        await addToWishlist(product._id);
        setWished(true);
        showToast("Added to wishlist", "success");
      } else {
        await removeFromWishlist(product._id);
        setWished(false);
        showToast("Removed from wishlist", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Wishlist action failed", "error");
    }
  };

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

      <button
        type="button"
        onClick={toggleWish}
        className="wishlist-btn"
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          zIndex: 11,
          background: "transparent",
          border: "none",
          fontSize: 20,
          cursor: "pointer",
        }}
        aria-label="Add to wishlist"
        title="Add to wishlist"
      >
        {wished ? "♥" : "♡"}
      </button>

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
          <div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn"
              style={{ marginLeft: 8 }}
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
