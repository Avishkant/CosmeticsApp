import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, saveTokens, saveUser } from "../lib/auth";
import { useToast } from "../components/ToastProvider";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(email, password); // returns { user, access, refresh }
      const { access, refresh, user } = res || {};
      if (access && refresh) {
        saveTokens(access, refresh);
      }
      if (user) saveUser(user);
      // Show toast then redirect (admins -> admin portal)
      const msg =
        user && user.role === "admin" ? "Welcome back, admin" : "Logged in";
      showToast(msg, "success");
      setTimeout(() => {
        if (user && user.role === "admin") navigate("/admin");
        else navigate("/");
      }, 600);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          autoComplete="username"
          className="w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          name="password"
          autoComplete="current-password"
          className="w-full border p-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
}
