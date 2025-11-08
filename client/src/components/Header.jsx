import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, clearAllAuth, saveUser, getUser } from "../lib/auth";
import { getCart, default as api } from "../lib/api";
import { useEffect, useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const handleLogout = () => {
    clearAllAuth();
    navigate("/");
  };
  const [cartInfo, setCartInfo] = useState(null);
  const [userState, setUserState] = useState(getUser());

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

    if (isAuthenticated()) {
      getCart()
        .then((r) => {
          if (mounted) setCartInfo(r.data);
        })
        .catch(() => {});
    }
    return () => (mounted = false);
  }, []);

  return (
    <header
      style={{
        backdropFilter: "blur(6px)",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
      }}
    >
      <div
        className="app-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to="/"
            className="text-lg font-semibold"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <div
              className="logo float-slow"
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background:
                  "linear-gradient(90deg,var(--accent),var(--accent-2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 800,
              }}
            >
              C
            </div>
            <div style={{ fontWeight: 800 }}>CosmeticsApp</div>
          </Link>
        </div>

        <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/" className="badge">
            Products
          </Link>
          <Link to="/cart" className="badge">
            Cart
            {cartInfo && cartInfo.coupon ? ` • ${cartInfo.coupon.code}` : ""}
          </Link>
          {isAuthenticated() ? (
            <>
              {userState && userState.role === "admin" && (
                <>
                  <Link to="/admin" className="btn btn-ghost">
                    Admin
                  </Link>
                  <Link to="/admin/products" className="btn btn-ghost">
                    Products
                  </Link>
                  <Link to="/admin/orders" className="btn btn-ghost">
                    Orders
                  </Link>
                  <Link to="/admin/payments" className="btn btn-ghost">
                    Payments
                  </Link>
                  <Link to="/admin-upload" className="btn btn-ghost">
                    Upload
                  </Link>
                </>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="text-sm text-muted">{userState?.email}</div>
                <button onClick={handleLogout} className="btn btn-outline">
                  Logout
                </button>
              </div>
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
        </nav>
      </div>
    </header>
  );
}
