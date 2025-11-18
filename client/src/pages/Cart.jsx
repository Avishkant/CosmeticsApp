import React, { useEffect, useState } from "react";
import {
  applyCartCoupon,
  removeCartCoupon,
  fetchProfile,
  addAddress,
  updateAddress,
} from "../lib/api";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import AddressModal from "../components/AddressModal";
import { useToast } from "../components/ToastProvider";

export default function Cart() {
  const { cart, loading, loadCart, removeItem, updateQty } = useCart();

  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const handleRemove = async (itemId) => {
    await removeItem(itemId);
  };

  const handleQty = async (item, nextQty) => {
    if (nextQty < 1) return;
    await updateQty({
      productId: item.productId._id || item.productId,
      variantId: item.variantId,
      qty: nextQty,
      price: item.price,
    });
  };

  const [coupon, setCoupon] = useState("");
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();
  const [discount, setDiscount] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const handleApplyCoupon = async () => {
    if (!coupon) return;
    try {
      const res = await applyCartCoupon(coupon);
      // server returns updated cart with coupon info
      // refresh cart from server/context
      await loadCart();
      const amount =
        res.data.coupon && res.data.coupon.amount ? res.data.coupon.amount : 0;
      setDiscount(amount);
      alert(`Coupon applied: -₹${amount.toFixed(2)}`);
    } catch (e) {
      console.error("Coupon validation failed", e);
      alert(e.response?.data?.error || "Invalid coupon");
      setDiscount(0);
    }
  };

  const subtotal = (cart?.items || []).reduce(
    (s, it) => s + (it.price || 0) * (it.qty || 0),
    0
  );

  // load profile and addresses for selection in cart
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await fetchProfile();
        if (!mounted) return;
        const prof = p.data || p;
        setProfile(prof);
        const addrs = (prof && prof.addresses) || [];
        setAddresses(addrs);
        if (addrs && addrs.length) setSelectedAddress(addrs[0]);
      } catch (e) {
        console.error("Failed to load profile for cart", e);
      }
    })();
    return () => (mounted = false);
  }, []);

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

  const handleSaveAddress = async (addr) => {
    try {
      if (addr._id) {
        await updateAddress(addr._id, addr);
        // reload profile
        const p = await fetchProfile();
        const prof = p.data || p;
        setProfile(prof);
        setAddresses(prof.addresses || []);
      } else {
        const res = await addAddress(addr);
        const saved = res.data || res;
        setAddresses((a) => [...a, saved]);
        setSelectedAddress(saved);
      }
      setShowAddressModal(false);
      setEditingAddress(null);
      showToast("Address saved", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to save address", "error");
      throw e;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
      <ul className="space-y-4">
        {cart.items.map((i) => (
          <li
            key={i._id}
            className="flex items-center gap-4 border p-4 rounded"
          >
            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
              <img
                src={
                  (i.productId.images &&
                    i.productId.images[0] &&
                    i.productId.images[0].url) ||
                  "/vite.svg"
                }
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="font-semibold">
                {i.productId.title || "Product"}
              </div>
              <div className="text-sm text-gray-600">₹{i.price}</div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => handleQty(i, i.qty - 1)}
                >
                  -
                </button>
                <div className="px-3">{i.qty}</div>
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => handleQty(i, i.qty + 1)}
                >
                  +
                </button>
                <button
                  className="text-red-600 text-sm ml-4"
                  onClick={() => handleRemove(i._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-between items-start gap-6">
        <div className="w-1/3">
          <h3 className="font-medium mb-2">Delivery Address</h3>
          {addresses && addresses.length ? (
            <div className="space-y-2 mb-4">
              {addresses.map((a) => (
                <label
                  key={a._id}
                  className={`p-3 border rounded block ${
                    selectedAddress &&
                    String(selectedAddress._id) === String(a._id)
                      ? "bg-indigo-50"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="addr"
                    checked={
                      selectedAddress &&
                      String(selectedAddress._id) === String(a._id)
                    }
                    onChange={() => setSelectedAddress(a)}
                  />{" "}
                  <strong>{a.label}</strong> — {a.addressLine1}, {a.city}{" "}
                  {a.pincode}
                </label>
              ))}
              <div className="mt-2">
                <button
                  type="button"
                  className="px-3 py-1 bg-indigo-600 text-white rounded"
                  onClick={openNewAddress}
                >
                  Add Address
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              No saved addresses.{" "}
              <button
                type="button"
                className="px-2 py-1 bg-indigo-600 text-white rounded ml-2"
                onClick={openNewAddress}
              >
                Add one
              </button>
            </div>
          )}

          <h3 className="font-medium">Apply coupon</h3>
          <div className="mt-2 flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="border p-2 rounded flex-1"
              placeholder="Coupon code"
            />
            <button
              onClick={handleApplyCoupon}
              className="bg-gray-200 px-3 rounded"
            >
              Apply
            </button>
          </div>
          {cart.coupon && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                Applied: {cart.coupon.code} - ₹
                {(cart.coupon.amount || 0).toFixed(2)}
              </span>
              <button
                className="text-xs text-red-600"
                onClick={async () => {
                  await removeCartCoupon();
                  await loadCart();
                  setDiscount(0);
                  setCoupon("");
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        <div className="w-1/3 border p-4 rounded">
          <div className="flex justify-between">
            <div>Subtotal</div>
            <div>₹{subtotal.toFixed(2)}</div>
          </div>
          <div className="flex justify-between mt-2">
            <div>Shipping</div>
            <div>₹0.00</div>
          </div>
          {discount > 0 && (
            <div className="flex justify-between mt-2 text-green-600">
              <div>Discount</div>
              <div>-₹{discount.toFixed(2)}</div>
            </div>
          )}
          <div className="flex justify-between font-semibold mt-4">
            <div>Total</div>
            <div>₹{(subtotal - discount).toFixed(2)}</div>
          </div>
          <div className="mt-4">
            <button
              disabled={processing}
              onClick={() =>
                navigate("/checkout", {
                  state: { selectedAddressId: selectedAddress?._id },
                })
              }
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded"
            >
              {processing ? "Processing..." : "Proceed to Checkout"}
            </button>
          </div>
        </div>
      </div>
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
  );
}
