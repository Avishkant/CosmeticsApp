import React, { useEffect, useState } from "react";
import { fetchProducts, getCart } from "../lib/api";
import { isAuthenticated } from "../lib/auth";
import ProductCard from "../components/ProductCard";
import { Link, useSearchParams } from "react-router-dom";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const sp = Object.fromEntries([...searchParams]);
    setQ(sp.q || "");
    setPage(Number(sp.page) || 1);
    setCategory(sp.category || "");
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProducts({ q, page, limit, category })
      .then((r) => {
        setProducts(r.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load");
        setLoading(false);
      });

    // fetch cart coupon if authenticated
    let mounted = true;
    if (isAuthenticated()) {
      getCart()
        .then((r) => {
          if (mounted && r.data && r.data.coupon) setCoupon(r.data.coupon);
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [q, page, limit, category]);

  function onSearch(e) {
    e.preventDefault();
    setSearchParams({ q, page: 1 });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          {category ? `${category} — Products` : "Products"}
        </h1>
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            className="border rounded p-2"
          />
          <button className="bg-indigo-600 text-white px-3 py-2 rounded">
            Search
          </button>
        </form>
      </div>

      {loading && <div>Loading products...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <Link key={p._id} to={`/product/${p.slug}`} className="block">
            <ProductCard product={p} coupon={coupon} />
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 border rounded"
        >
          Prev
        </button>
        <div>Page {page}</div>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
