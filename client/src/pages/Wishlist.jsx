import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import { useToast } from "../components/ToastProvider";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/me/wishlist");
      // axios responses are typically { data: <payload> }, and our server
      // returns { data: [...] } so normalize to the inner data array.
      setItems(res.data?.data || res.data || []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load wishlist", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (id) => {
    try {
      await api.delete(`/users/me/wishlist/${id}`);
      setItems((it) => it.filter((p) => String(p._id || p) !== String(id)));
      showToast("Removed from wishlist", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to remove", "error");
    }
  };

  const { addItem } = useCart();

  const handleMoveToCart = async (p) => {
    try {
      // basic: add first variant or product with qty 1
      const productId = p._id || p;
      let variantId =
        (p.variants && p.variants[0] && p.variants[0].variantId) || null;
      let price =
        p.price || (p.variants && p.variants[0] && p.variants[0].price) || null;

      // If price is missing (wishlist item may be just an id), fetch product to resolve price
      if (!price) {
        try {
          const r = await api.get(`/products/${productId}`);
          const prod = r.data?.data || r.data;
          if (prod) {
            price =
              prod.price ||
              (prod.variants && prod.variants[0] && prod.variants[0].price) ||
              price;
            variantId =
              variantId ||
              (prod.variants &&
                prod.variants[0] &&
                prod.variants[0].variantId) ||
              variantId;
          }
        } catch (e) {
          console.warn("Failed to fetch product for price resolution", e);
        }
      }

      if (!price && price !== 0)
        throw new Error("Cannot determine price for product");

      // ensure numeric price
      price = Number(price);
      if (Number.isNaN(price)) throw new Error("Price is not a number");

      // coerce IDs to strings to satisfy server validation
      const pid = productId ? String(productId) : productId;
      const vid = variantId != null ? String(variantId) : undefined;

      const payload = { productId: pid, variantId: vid, qty: 1, price };
      console.debug("Adding to cart payload:", payload);
      try {
        await addItem(payload);
      } catch (err) {
        console.error("addItem failed:", err?.response?.data || err);
        throw err;
      }
      showToast("Added to cart", "success");
      // Optionally remove from wishlist
      await api.delete(`/users/me/wishlist/${p._id || p}`);
      setItems((it) =>
        it.filter((x) => String(x._id || x) !== String(p._id || p))
      );
      navigate("/cart");
    } catch (e) {
      console.error(e);
      // prefer server-provided message when available
      const msg =
        e?.response?.data?.error || e?.message || "Failed to move to cart";
      showToast(msg, "error");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">My Wishlist</h2>
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div>No items in wishlist</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((p) => (
            <div key={p._id || p} className="block">
              {typeof p === "object" ? (
                <>
                  <Link to={`/product/${p.slug}`} className="block">
                    <ProductCard product={p} />
                  </Link>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleMoveToCart(p)}
                    >
                      Move to cart
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleRemove(p._id)}
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 border rounded">Product {p}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
