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
      setItems(res.data || res.data === undefined ? res.data : res);
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
      const variantId =
        (p.variants && p.variants[0] && p.variants[0].variantId) || null;
      await addItem({
        productId: p._id || p,
        variantId,
        qty: 1,
        price: p.price || (p.variants && p.variants[0] && p.variants[0].price),
      });
      showToast("Added to cart", "success");
      // Optionally remove from wishlist
      await api.delete(`/users/me/wishlist/${p._id || p}`);
      setItems((it) =>
        it.filter((x) => String(x._id || x) !== String(p._id || p))
      );
      navigate("/cart");
    } catch (e) {
      console.error(e);
      showToast("Failed to move to cart", "error");
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
