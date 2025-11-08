import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register, saveTokens, saveUser } from "../lib/auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await register(name, email, password);
      const { access, refresh, user } = res || {};
      if (access && refresh) saveTokens(access, refresh);
      if (user) saveUser(user);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Register</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">
          Register
        </button>
      </form>
    </div>
  );
}
