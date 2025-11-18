import React, { useEffect, useState } from "react";
import { fetchProfile, createCheckout, verifyPayment } from "../lib/api";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";

export default function Checkout() {
  const { cart } = useCart();
  const [profile, setProfile] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [selectedShipping, setSelectedShipping] = useState({
    key: "standard",
    label: "Standard (3-5 days)",
    cost: 30,
  });
  const shippingOptions = [
    { key: "standard", label: "Standard (3-5 days)", cost: 30 },
    { key: "express", label: "Express (1-2 days)", cost: 80 },
    { key: "free", label: "Free (7-10 days)", cost: 0 },
  ];
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await fetchProfile();
        if (!mounted) return;
        const prof = p.data || p;
        setProfile(prof);
        if (prof && prof.addresses && prof.addresses.length) {
          setSelectedAddress(prof.addresses[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return showToast("Select delivery address", "error");
    const items = (cart?.items || []).map((it) => ({
      productId: it.productId && (it.productId._id || it.productId),
      variantId:
        it.variantId ||
        (it.productId &&
          it.productId.variants &&
          it.productId.variants[0] &&
          it.productId.variants[0].variantId) ||
        null,
      qty: it.qty || 1,
      price:
        it.price ||
        (it.productId &&
          it.productId.variants &&
          it.productId.variants[0] &&
          it.productId.variants[0].price) ||
        0,
    }));

    const shipping = {
      address: selectedAddress.addressLine1 || "",
      city: selectedAddress.city || "",
      state: selectedAddress.state || "",
      pincode: selectedAddress.pincode || "",
      name: selectedAddress.name || "",
      phone: selectedAddress.phone || "",
      label: selectedAddress.label || "",
      method: selectedShipping.key,
      cost: selectedShipping.cost || 0,
    };

    try {
      setLoading(true);
      const res = await createCheckout({
        items,
        shipping,
        couponCode: cart.coupon && cart.coupon.code,
        paymentMethod,
      });
      const data = res.data || res;
      const order = data.order || data.order || data;

      if (data.razorpayOrder) {
        // Razorpay flow
        await loadRazorpayScript();
        const options = {
          key: data.razorpayKeyId || data.razorpayKey || "",
          amount: Math.round(order.total * 100),
          currency: "INR",
          name: "Beautiq",
          description: `Order ${order._id}`,
          order_id:
            data.razorpayOrder.id ||
            data.razorpayOrderId ||
            (data.razorpayOrder && data.razorpayOrder.id),
          handler: async function (response) {
            try {
              await verifyPayment({
                orderId: order._id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              showToast("Payment successful", "success");
              navigate(`/orders/${order._id}`);
            } catch (e) {
              console.error(e);
              showToast("Payment verification failed", "error");
            }
          },
          prefill: {
            name: profile?.name,
            email: profile?.email,
            contact: profile?.phone,
          },
          theme: { color: "#4f46e5" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Non-razorpay (e.g., COD)
        showToast("Order placed", "success");
        navigate(`/orders/${order._id}`);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to create order", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading checkout...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Checkout</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="font-medium mb-2">Delivery Address</h3>
          {profile && profile.addresses && profile.addresses.length ? (
            <div className="space-y-2">
              {profile.addresses.map((a) => (
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
            </div>
          ) : (
            <div>No saved addresses. Add one in your account.</div>
          )}

          <h3 className="mt-6 font-medium mb-2">Shipping Method</h3>
          <div className="space-y-2">
            {shippingOptions.map((s) => (
              <label key={s.key} className={`p-3 border rounded block`}>
                <input
                  type="radio"
                  name="shipping"
                  checked={selectedShipping.key === s.key}
                  onChange={() => setSelectedShipping(s)}
                />{" "}
                {s.label} — {s.cost ? `₹${s.cost}` : "Free"}
              </label>
            ))}
          </div>

          <h3 className="mt-6 font-medium mb-2">Payment Method</h3>
          <div className="space-y-2">
            <label className={`p-3 border rounded block`}>
              <input
                type="radio"
                name="pm"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
              />{" "}
              Razorpay
            </label>
            <label className={`p-3 border rounded block`}>
              <input
                type="radio"
                name="pm"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />{" "}
              Cash on Delivery
            </label>
            <label className={`p-3 border rounded block`}>
              <input
                type="radio"
                name="pm"
                checked={paymentMethod === "upi"}
                onChange={() => setPaymentMethod("upi")}
              />{" "}
              UPI (placeholder)
            </label>
            <label className={`p-3 border rounded block`}>
              <input
                type="radio"
                name="pm"
                checked={paymentMethod === "wallet"}
                onChange={() => setPaymentMethod("wallet")}
              />{" "}
              Wallet (placeholder)
            </label>
          </div>
        </div>

        <div>
          <h3 className="font-medium">Order Summary</h3>
          <div className="mt-2">
            {(cart?.items || []).map((it) => (
              <div
                key={it._id || it.productId}
                className="flex justify-between py-2 border-b"
              >
                <div>
                  {(it.productId && (it.productId.title || it.productId)) ||
                    "Product"}{" "}
                  x {it.qty}
                </div>
                <div>₹{(it.price || 0) * (it.qty || 1)}</div>
              </div>
            ))}
            <div className="mt-3">
              <div className="flex justify-between">
                <div>Subtotal</div>
                <div>
                  ₹
                  {(
                    (cart?.items || []).reduce(
                      (s, it) => s + (it.price || 0) * (it.qty || 1),
                      0
                    ) || 0
                  ).toFixed(2)}
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <div>Shipping</div>
                <div>₹{(selectedShipping.cost || 0).toFixed(2)}</div>
              </div>
              {cart.coupon && cart.coupon.amount > 0 && (
                <div className="flex justify-between mt-2 text-green-600">
                  <div>Discount</div>
                  <div>-₹{(cart.coupon.amount || 0).toFixed(2)}</div>
                </div>
              )}
              <div className="flex justify-between font-semibold mt-4">
                <div>Total</div>
                <div>
                  ₹
                  {(
                    ((cart?.items || []).reduce(
                      (s, it) => s + (it.price || 0) * (it.qty || 1),
                      0
                    ) || 0) +
                    (selectedShipping.cost || 0) -
                    (cart && cart.coupon && cart.coupon.amount
                      ? cart.coupon.amount
                      : 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="bg-indigo-600 text-white px-4 py-2 rounded w-full"
                onClick={handlePlaceOrder}
                disabled={loading || !cart?.items?.length}
              >
                {loading ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
