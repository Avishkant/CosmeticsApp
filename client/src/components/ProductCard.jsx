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
  const variant = (product.variants && product.variants[0]) || {};
  const price = variant.price || 0;
  const mrp = variant.mrp || price;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
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
    <div className="card relative overflow-hidden rounded-lg transition-transform duration-150">
      {coupon && (
        <div className="absolute left-3 top-3 z-10 badge badge-accent">
          {coupon.code} - ₹{(coupon.amount || 0).toFixed(2)}
        </div>
      )}

      <button
        type="button"
        onClick={toggleWish}
        className="wishlist-btn absolute right-3 top-3 z-20 bg-transparent border-0 text-xl cursor-pointer"
        aria-label="Add to wishlist"
        title="Add to wishlist"
      >
        {wished ? "♥" : "♡"}
      </button>

      <div className="w-full h-56 overflow-hidden rounded-md">
        <img
          src={img}
          alt={product.title}
          className="w-full h-full object-cover img-zoom"
        />
      </div>

      <div className="pt-3 px-0">
        <h3 className="text-base font-bold">{product.title}</h3>
        <p className="text-sm text-gray-500">{product.brand}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-right">
            <div>
              <span className="price-current">₹{price}</span>
              {mrp > price && (
                <span className="ml-2 price-mrp">
                  <s>₹{mrp}</s>
                </span>
              )}
            </div>
            {discount > 0 && (
              <div className="price-discount mt-1">{discount}% off</div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn ml-2"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
