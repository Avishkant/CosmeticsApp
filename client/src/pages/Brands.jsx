import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// small inline icons to avoid adding an external dependency
const ClockIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 6v6l4 2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Helper function to recursively find a logo URL from complex  objects
function resolveLogo(logo) {
  if (!logo) return null;
  if (typeof logo === "string") return logo;

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
}

// --- Motion Variants for List Entrance ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get("/brands")
      .then((r) => {
        if (!mounted) return;
        const list = r.data?.data || r.data || [];
        const normalized = (list || []).map((b) => ({
          ...b,
          logo: resolveLogo(b.logo),
        }));
        setBrands(normalized);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError("Failed to load brands");
        setLoading(false);
      });
    return () => (mounted = false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200"
        >
          <h1 className="text-3xl font-extrabold text-gray-800">
            Brand Partners
          </h1>
          <div className="text-sm text-gray-600">
            Discover our trusted brand partners
          </div>
        </motion.div>

        {loading && (
          <div className="text-center text-gray-600 py-10">
            Loading brands...
          </div>
        )}
        {error && <div className="text-center text-red-600 py-10">{error}</div>}

        {/* Brands Grid */}
        {!loading && !error && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {brands.map((b) => (
              <motion.div
                key={b._id}
                variants={itemVariants}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)",
                }}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg transition-all duration-300"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Logo Area */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
                    {b.logo ? (
                      <img
                        src={b.logo}
                        alt={b.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        No Logo
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="text-xl font-bold text-gray-900">
                      {b.name}
                    </div>
                    {b.description && (
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {b.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className="mt-2 p-4 pt-0 flex flex-wrap items-center justify-between border-t border-gray-100">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" /> Joined:{" "}
                    {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                  <Link
                    to={`/products?brand=${encodeURIComponent(b.name)}`}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
                  >
                    View products <ChevronRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
