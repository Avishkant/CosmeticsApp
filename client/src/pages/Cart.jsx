import React, { useEffect, useState } from "react";
import {
  applyCartCoupon as apiApplyCartCoupon,
  removeCartCoupon as apiRemoveCartCoupon,
  fetchProfile,
  addAddress,
  updateAddress,
} from "../lib/api";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import AddressModal from "../components/AddressModal";
import { useToast } from "../components/ToastProvider";

export default function Cart() {
  const {
    cart = { items: [] },
    loading,
    loadCart,
    removeItem,
    updateQty,
  } = useCart();

  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const handleRemove = async (itemId) => {
    await removeItem(itemId);
    await loadCart();
  };

  const handleQty = async (item, nextQty) => {
    if (nextQty < 1) return;
    await updateQty({
      productId: item.productId._id || item.productId,
      variantId: item.variantId,
      qty: nextQty,
      price: item.price,
    });
    await loadCart();
  };

  const [coupon, setCoupon] = useState("");
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();
  const [discount, setDiscount] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchProfile();
        setProfile(p?.data || null);
        setAddresses(p?.data?.addresses || []);
        if (p?.data?.addresses && p.data.addresses.length) {
          setSelectedAddress(p.data.addresses[0]);
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    // recompute discount if cart changed
    setDiscount(cart?.coupon?.amount || 0);
  }, [cart]);

  const subtotal = (cart.items || []).reduce(
    (s, it) => s + Number(it.price || 0) * Number(it.qty || 1),
    0
  );

  const openNewAddress = () => {
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (addr) => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress._id, addr);
      } else {
        await addAddress(addr);
      }
      const p = await fetchProfile();
      setAddresses(p?.data?.addresses || []);
      setShowAddressModal(false);
      showToast("Address saved");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save address");
    }
  };

  const handleApplyCoupon = async () => {
    try {
      setProcessing(true);
      await apiApplyCartCoupon({ code: coupon });
      await loadCart();
      setCoupon("");
      showToast("Coupon applied");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to apply coupon");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCartCoupon = async () => {
    try {
      await apiRemoveCartCoupon();
      await loadCart();
      setCoupon("");
      setDiscount(0);
      showToast("Coupon removed");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to remove coupon");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Your Cart</h2>

      <div className="flex gap-6 items-start">
        {/* Left - main cart */}
        <div className="flex-1">
          <div className="p-4 rounded bg-white shadow">
            <div className="border rounded p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  My Bag ({(cart.items || []).length} items)
                </h3>
                <div className="text-sm text-gray-600">
                  Delivering to{" "}
                  {selectedAddress ? selectedAddress.city : "your address"}
                </div>
              </div>

              <ul className="space-y-4">
                {cart.items.map((i) => (
                  <li key={i._id} className="flex gap-4 items-start">
                    <div className="w-24 h-24 bg-gray-50 rounded overflow-hidden flex-shrink-0">
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
                      <div className="font-semibold text-lg">
                        {i.productId.title || "Product"}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {i.productId.brand || ""}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-1 border rounded"
                            onClick={() => handleQty(i, i.qty - 1)}
                          >
                            -
                          </button>
                          <div className="px-4">{i.qty}</div>
                          <button
                            className="px-3 py-1 border rounded"
                            onClick={() => handleQty(i, i.qty + 1)}
                          >
                            +
                          </button>
                        </div>
                        <div className="text-base font-semibold">
                          ₹{i.price}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        className="text-sm text-red-600"
                        onClick={() => handleRemove(i._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right - summary */}
        <aside style={{ width: 360 }}>
          <div className="border rounded p-4 mb-4 bg-white">
            <h4 className="font-semibold mb-2">Coupons & Bank Offers</h4>
            <div className="text-sm text-gray-600 mb-3">
              Login to Apply Coupons & Bank Offers
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium mb-2">Apply coupon</div>
              <div className="flex gap-2">
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
                    onClick={handleRemoveCartCoupon}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="font-medium text-gray-700 mb-2">Price Details</div>
            <div className="flex justify-between">
              <div className="text-sm text-gray-600">Total MRP</div>
              <div>₹{subtotal.toFixed(2)}</div>
            </div>
            <div className="flex justify-between mt-3 font-semibold text-lg">
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
                className="w-full bg-black text-white px-4 py-3 rounded"
              >
                Checkout
              </button>
            </div>
          </div>
        </aside>
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
