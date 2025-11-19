import React, { useEffect, useState, useRef } from "react";
import {
  fetchProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  fetchMyOrders,
  fetchOrder,
} from "../lib/api";
import AddressModal from "../components/AddressModal";
import { useToast } from "../components/ToastProvider";

export default function Account() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profile");
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const p = await fetchProfile();
      setProfile(p.data || p);
      setAddresses((p.data && p.data.addresses) || p.addresses || []);
      const o = await fetchMyOrders();
      setOrders(o.data || o);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const { showToast } = useToast();

  const saveProfile = async () => {
    try {
      const res = await updateProfile({
        name: profile.name,
        phone: profile.phone,
      });
      setProfile(res.data || res);
      showToast("Profile updated", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to update profile", "error");
    }
  };
  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const openNewAddress = () => {
    setEditingAddress({
      label: "Home",
      name: profile?.name || "",
      phone: profile?.phone || "",
      addressLine1: "",
      city: "",
      state: "",
      pincode: "",
    });
    setShowAddressModal(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress({ ...addr });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (addr) => {
    try {
      if (addr._id) {
        await updateAddress(addr._id, addr);
        await load();
      } else {
        const res = await addAddress(addr);
        // add to local list
        setAddresses((a) => [...a, res.data || res]);
      }
      setShowAddressModal(false);
      setEditingAddress(null);
    } catch (e) {
      console.error(e);
      showToast("Failed to save address", "error");
    }
  };

  const handleDeleteAddress = async (addr) => {
    if (!confirm("Delete this address?")) return;
    try {
      await deleteAddress(addr._id);
      setAddresses((a) => a.filter((x) => String(x._id) !== String(addr._id)));
      showToast("Address deleted", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to delete address", "error");
    }
  };

  // Delivery tracking state
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!trackingOrderId) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setTrackingData(null);
      return;
    }

    const loadTracking = async () => {
      try {
        const r = await fetchOrder(trackingOrderId);
        setTrackingData(r.data || r);
      } catch (e) {
        console.error("Failed to fetch order for tracking", e);
      }
    };

    // initial load
    loadTracking();
    // poll every 8 seconds
    pollRef.current = setInterval(loadTracking, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [trackingOrderId]);

  if (loading) return <div className="p-6">Loading account...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">My Account</h2>
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => setTab("profile")}
          className={`px-3 py-2 rounded ${
            tab === "profile" ? "bg-indigo-600 text-white" : "bg-gray-100"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setTab("addresses")}
          className={`px-3 py-2 rounded ${
            tab === "addresses" ? "bg-indigo-600 text-white" : "bg-gray-100"
          }`}
        >
          Addresses
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-3 py-2 rounded ${
            tab === "orders" ? "bg-indigo-600 text-white" : "bg-gray-100"
          }`}
        >
          Orders
        </button>
      </div>

      {tab === "profile" && (
        <div className="border p-4 rounded">
          <label className="block mb-2">Name</label>
          <input
            className="border p-2 w-full mb-3"
            value={profile.name || ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
          <label className="block mb-2">Email</label>
          <input
            className="border p-2 w-full mb-3"
            value={profile.email || ""}
            disabled
          />
          <label className="block mb-2">Phone</label>
          <input
            className="border p-2 w-full mb-3"
            value={profile.phone || ""}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              onClick={saveProfile}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button onClick={load} className="bg-gray-100 px-4 py-2 rounded">
              Reload
            </button>
          </div>
        </div>
      )}

      {tab === "addresses" && (
        <div className="border p-4 rounded">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Addresses</h3>
            <button
              onClick={openNewAddress}
              className="bg-indigo-600 text-white px-3 py-1 rounded"
            >
              Add
            </button>
          </div>
          <ul className="space-y-3">
            {addresses.map((a) => (
              <li
                key={a._id}
                className="border p-3 rounded flex justify-between items-start"
              >
                <div>
                  <div className="font-semibold">{a.label || "Home"}</div>
                  <div className="text-sm">
                    {a.name} • {a.phone}
                  </div>
                  <div className="text-sm mt-1">
                    {a.addressLine1}, {a.city} {a.pincode}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditAddress(a)}
                      className="px-3 py-1 border rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(a)}
                      className="px-3 py-1 border rounded text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {showAddressModal && (
            <AddressModal
              address={editingAddress}
              onSave={handleSaveAddress}
              onCancel={() => {
                setShowAddressModal(false);
                setEditingAddress(null);
              }}
            />
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="border p-4 rounded">
          <h3 className="font-medium mb-3">Order History</h3>
          {orders.length === 0 && <div>No orders yet</div>}
          <ul className="space-y-3">
            {orders.map((o) => {
              const first = o.items && o.items.length > 0 ? o.items[0] : null;
              const prod =
                first && first.productId && typeof first.productId === "object"
                  ? first.productId
                  : null;
              const title =
                (prod && (prod.title || prod.name)) ||
                (first && typeof first.productId === "string"
                  ? first.productId
                  : null);
              const img =
                prod && prod.images && prod.images[0] && prod.images[0].url;
              return (
                <li
                  key={o._id}
                  className="p-3 border rounded flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    {first && (
                      <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={img || "/vite.svg"}
                          alt={title || "Product"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">Order {o._id}</div>
                      <div className="text-sm">
                        {new Date(o.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm">Status: {o.status}</div>
                      {o.items && o.items.length > 0 && (
                        <div className="text-sm mt-1 text-gray-600">
                          {o.items.length} item{o.items.length > 1 ? "s" : ""}
                          {title ? ` • ${title}` : ""}
                        </div>
                      )}
                      {o.shipping && (
                        <div className="text-sm mt-1">
                          Courier: {o.shipping.courier || "-"} • AWB:{" "}
                          {o.shipping.awb || "-"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a className="btn btn-ghost" href={`/orders/${o._id}`}>
                      View
                    </a>
                    <button
                      onClick={() => setTrackingOrderId(o._id)}
                      className="px-3 py-1 border rounded"
                    >
                      Track
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Tracking panel */}
          {trackingOrderId && (
            <div className="mt-4 border p-3 rounded bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    Tracking Order {trackingOrderId}
                  </div>
                  <div className="text-sm">
                    Status: {trackingData?.status || "loading..."}
                  </div>
                  <div className="text-sm">
                    Courier: {trackingData?.shipping?.courier || "-"} • AWB:{" "}
                    {trackingData?.shipping?.awb || "-"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTrackingOrderId(null);
                      setTrackingData(null);
                    }}
                    className="px-3 py-1 border rounded"
                  >
                    Stop
                  </button>
                  <a
                    className="px-3 py-1 border rounded"
                    href={`/orders/${trackingOrderId}`}
                  >
                    Open
                  </a>
                </div>
              </div>
              {trackingData && trackingData.items && (
                <div className="mt-3">
                  <h4 className="font-medium">Items</h4>
                  <ul className="mt-2 space-y-1">
                    {trackingData.items.map((it) => {
                      const prod =
                        it.productId && typeof it.productId === "object"
                          ? it.productId
                          : null;
                      const title =
                        (prod && (prod.title || prod.name)) ||
                        (typeof it.productId === "string"
                          ? it.productId
                          : "Product");
                      const img =
                        prod &&
                        prod.images &&
                        prod.images[0] &&
                        prod.images[0].url;
                      return (
                        <li
                          key={it._id || it.productId}
                          className="flex items-center gap-2"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={img || "/vite.svg"}
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-sm">
                            {title} x {it.qty}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
