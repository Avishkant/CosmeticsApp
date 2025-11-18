import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout, saveUser, getUser } from "../lib/auth";
import api from "../lib/api";
import { useEffect, useState } from "react";
import { useCart } from "../contexts/CartContext";

export default function Header() {
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
          >
            <div className="logo">B</div>
            <div className="brand-name">Beautiq</div>
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
          <nav className="primary-nav">
            {currentUser && currentUser.role === "admin" ? (
              // Admin nav links
              <>
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
              </>
            ) : (
              // Public nav links (navigate to products filtered by category)
              <>
                <Link to="/products?category=Brands" className="nav-link">
                  Brands
                </Link>
                <Link to="/products?category=Holidays" className="nav-link">
                  Holidays
                </Link>
                <Link to="/products?category=Sale" className="nav-link">
                  Sale
                </Link>
                <Link to="/products?category=Skin%20Care" className="nav-link">
                  Skin Care
                </Link>
                <Link to="/products?category=Hair" className="nav-link">
                  Hair
                </Link>
                <Link to="/products?category=Makeup" className="nav-link">
                  Makeup
                </Link>
                <Link
                  to="/products?category=Bath%20%26%20Body"
                  className="nav-link"
                >
                  Bath &amp; Body
                </Link>
                <Link to="/products?category=Fragrance" className="nav-link">
                  Fragrance
                </Link>
                <Link to="/products?category=Self%20Care" className="nav-link">
                  Self Care
                </Link>
                <Link to="/products?category=Tools" className="nav-link">
                  Tools
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* removed secondary nav to keep a single navbar */}
    </header>
  );
}
