import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout, saveUser, getUser } from "../lib/auth";
import api from "../lib/api";
import { useEffect, useState } from "react";
import { useCart } from "../contexts/CartContext";
import logo from "../assets/logo.svg";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const [searchQ, setSearchQ] = React.useState("");
  const [cartInfo, setCartInfo] = useState(null);
  const [userState, setUserState] = useState(getUser());

  // Keep a derived currentUser that prefers latest localStorage value so
  // the header reacts immediately after login without requiring a full reload.
  const currentUser = getUser() || userState;

  useEffect(() => {
    let mounted = true;
    // ensure we have the latest user profile saved
    const localUser = getUser();
    if (!localUser && isAuthenticated()) {
      api
        .get("/auth/me")
        .then((r) => {
          const u = r.data && r.data.data;
          if (u) {
            saveUser(u);
            setUserState(u);
          }
        })
        .catch(() => {});
    } else {
      setUserState(localUser);
    }

    // cart is provided by CartProvider; copy it to local derived state if present
    // keep existing behaviour to update quickly after login
    return () => (mounted = false);
  }, []);

  const { cart } = useCart();

  // mirror cart into cartInfo for template compatibility
  useEffect(() => {
    if (cart) setCartInfo(cart);
  }, [cart]);

  return (
    <header className="site-header">
      <div className="header-top app-container">
        <div className="header-left">
          <Link
            to={currentUser && currentUser.role === "admin" ? "/admin" : "/"}
            className="brand"
            aria-label="Beautiq home"
          >
            <img src={logo} alt="Beautiq" className="logo site-logo" />
          </Link>
        </div>

        <div className="header-center">
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              const q = (searchQ || "").trim();
              navigate(`/products?q=${encodeURIComponent(q)}&page=1`);
            }}
          >
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="search-input"
              placeholder="Search for a product or brand"
            />
            <button type="submit" className="search-btn">
              🔍
            </button>
          </form>
        </div>

        <div className="header-right">
          {isAuthenticated() ? (
            <>
              {currentUser && currentUser.role === "admin" && (
                <Link
                  to="/admin"
                  className="btn btn-ghost"
                  style={{ marginRight: 8 }}
                >
                  Dashboard
                </Link>
              )}
              <div className="user-email">{currentUser?.email}</div>
              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-ghost">
                Register
              </Link>
            </>
          )}
          {/* account/cart icons */}
          <div className="icons">
            <Link to="/account" className="icon-link">
              👤
            </Link>
            <Link to="/wishlist" className="icon-link" title="Wishlist">
              ❤️
            </Link>
            {(currentUser?.role || "user") !== "admin" && (
              <Link to="/cart" className="icon-link">
                🛒
                {cartInfo && cartInfo.coupon
                  ? ` • ${cartInfo.coupon.code}`
                  : ""}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* primary categories row */}
      <div className="top-nav">
        <div className="nav-inner app-container">
          <nav className="primary-nav flex items-center justify-between">
            {currentUser && currentUser.role === "admin" ? (
              // Admin nav stays as full nav (hidden on small screens behind menu)
              <div className="hidden lg:flex gap-4">
                <Link to="/admin" className="nav-link">
                  Dashboard
                </Link>
                <Link to="/admin/products" className="nav-link">
                  Products
                </Link>
                <Link to="/admin/orders" className="nav-link">
                  Orders
                </Link>
                <Link to="/admin/payments" className="nav-link">
                  Payments
                </Link>
                <Link to="/admin/users" className="nav-link">
                  Users
                </Link>
                <Link to="/admin/coupons" className="nav-link">
                  Coupons
                </Link>
              </div>
            ) : (
              // Public nav: full list on large screens, compact on small screens
              <>
                <div className="hidden lg:flex gap-4">
                  <Link to="/brands" className="nav-link">
                    Brands
                  </Link>
                  <Link to="/products?category=Holidays" className="nav-link">
                    Holidays
                  </Link>
                  <Link to="/products?category=Sale" className="nav-link">
                    Sale
                  </Link>
                  <Link to="/skin-care" className="nav-link">
                    Skin Care
                  </Link>
                  <Link to="/hair" className="nav-link">
                    Hair
                  </Link>
                  <Link to="/makeup" className="nav-link">
                    Makeup
                  </Link>
                  <Link to="/lip-care" className="nav-link">
                    Lip Care
                  </Link>
                  <Link to="/bath-body" className="nav-link">
                    Bath &amp; Body
                  </Link>
                  <Link to="/fragrance" className="nav-link">
                    Fragrance
                  </Link>
                  <Link
                    to="/products?category=Self%20Care"
                    className="nav-link"
                  >
                    Self Care
                  </Link>
                  <Link to="/products?category=Tools" className="nav-link">
                    Tools
                  </Link>
                </div>

                <div className="flex items-center justify-between w-full lg:hidden">
                  <div className="flex gap-3">
                    <Link to="/skin-care" className="nav-link">
                      Skin Care
                    </Link>
                    <Link to="/hair" className="nav-link">
                      Hair
                    </Link>
                    <Link to="/bath-body" className="nav-link">
                      Bath
                    </Link>
                  </div>
                  <button
                    aria-label="Open menu"
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {/* mobile menu overlay */}
            {mobileOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <div
                  className="absolute right-0 top-0 w-3/4 max-w-sm h-full bg-white p-6 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <img src={logo} alt="logo" className="h-8" />
                    <button
                      onClick={() => setMobileOpen(false)}
                      aria-label="Close menu"
                      className="p-2 rounded-md"
                    >
                      ✕
                    </button>
                  </div>
                  <nav className="flex flex-col gap-3">
                    {currentUser && currentUser.role === "admin" ? (
                      <>
                        <Link
                          to="/admin"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/admin/products"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Products
                        </Link>
                        <Link
                          to="/admin/orders"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Orders
                        </Link>
                        <Link
                          to="/admin/payments"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Payments
                        </Link>
                        <Link
                          to="/admin/users"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Users
                        </Link>
                        <Link
                          to="/admin/coupons"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Coupons
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/brands"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Brands
                        </Link>
                        <Link
                          to="/products?category=Holidays"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Holidays
                        </Link>
                        <Link
                          to="/products?category=Sale"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Sale
                        </Link>
                        <Link
                          to="/skin-care"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Skin Care
                        </Link>
                        <Link
                          to="/hair"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Hair
                        </Link>
                        <Link
                          to="/makeup"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Makeup
                        </Link>
                        <Link
                          to="/lip-care"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Lip Care
                        </Link>
                        <Link
                          to="/bath-body"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Bath &amp; Body
                        </Link>
                        <Link
                          to="/fragrance"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Fragrance
                        </Link>
                        <Link
                          to="/products?category=Self%20Care"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Self Care
                        </Link>
                        <Link
                          to="/products?category=Tools"
                          className="nav-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          Tools
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* removed secondary nav to keep a single navbar */}
    </header>
  );
}
