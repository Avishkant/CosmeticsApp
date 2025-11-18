import React, { useEffect, useState } from "react";
import {
  fetchProductBySlug,
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../lib/api";
import { useParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { isAuthenticated } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wished, setWished] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchProductBySlug(slug)
      .then(async (r) => {
        if (!mounted) return;
        const prod = r.data;
        setProduct(prod);
        setLoading(false);
        try {
          const wl = await fetchWishlist();
          const list = wl.data || wl || [];
          const found = (list || []).some(
            (p) => String(p._id) === String(prod._id) || p.slug === prod.slug
          );
          if (found) setWished(true);
        } catch (e) {
          // ignore
        }
      })
      .catch(() => setLoading(false));
    return () => (mounted = false);
  }, [slug]);

  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (product && product.variants && product.variants.length)
      setSelectedVariant(product.variants[0]);
  }, [product]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!product) return <div className="p-6">Product not found</div>;

  const { addItem } = useCart();

  const handleAdd = async () => {
    if (!isAuthenticated()) return navigate("/login");
    const variant =
      selectedVariant || (product.variants && product.variants[0]) || {};
    try {
      await addItem({
        productId: product._id,
        variantId: variant.variantId || variant._id,
        qty,
        price: variant.price || 0,
      });
      setToast("Added to cart");
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleWish = async () => {
    if (!isAuthenticated()) return navigate("/login");
    try {
      if (!wished) {
        await addToWishlist(product._id);
        setWished(true);
      } else {
        await removeFromWishlist(product._id);
        setWished(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <img
            src={
              (product.images && product.images[0] && product.images[0].url) ||
              "/vite.svg"
            }
            alt={product.title}
            className="w-full h-96 object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <p className="text-sm text-gray-600">{product.brand}</p>
          <div className="mt-4">
            <h3 className="font-medium">Description</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>
          {product.variants && product.variants.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm text-gray-700">Variant</label>
              <select
                className="mt-2 border p-2 rounded w-full"
                value={
                  selectedVariant &&
                  (selectedVariant.variantId || selectedVariant._id)
                }
                onChange={(e) => {
                  const v = product.variants.find(
                    (x) =>
                      (x.variantId || x._id).toString() ===
                      e.target.value.toString()
                  );
                  setSelectedVariant(v);
                }}
              >
                {product.variants.map((v) => (
                  <option
                    key={v.variantId || v._id}
                    value={v.variantId || v._id}
                  >
                    {v.name || v.sku || `${v.color || ""} ${v.size || ""}`} - ₹
                    {v.price}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm">Quantity</label>
            <div className="flex items-center border rounded">
              <button
                className="px-3"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                -
              </button>
              <div className="px-4">{qty}</div>
              <button className="px-3" onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              className="bg-indigo-600 text-white px-4 py-2 rounded"
              onClick={handleAdd}
            >
              Add to cart
            </button>
            <button
              className={`px-4 py-2 rounded border ${
                wished ? "bg-red-100" : ""
              }`}
              onClick={toggleWish}
            >
              {wished ? "Remove from wishlist" : "Add to wishlist"}
            </button>
            {toast && (
              <div className="inline-block ml-4 text-sm text-green-600">
                {toast}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
