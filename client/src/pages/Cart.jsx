import React, { useEffect, useState } from "react";
import {
  getCart,
  removeCartItem,
  updateCartQuantity,
  createCheckout,
  verifyPayment,
  applyCartCoupon,
  removeCartCoupon,
} from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState({ items: [], coupon: null });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCart();
      setCart(res.data || { items: [] });
    } catch {
      setCart({ items: [] });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (itemId) => {
    await removeCartItem(itemId);
    await load();
  };

  const handleQty = async (item, nextQty) => {
    if (nextQty < 1) return;
    await updateCartQuantity({
      productId: item.productId._id || item.productId,
      variantId: item.variantId,
      qty: nextQty,
      price: item.price,
    });
    await load();
  };

  const [coupon, setCoupon] = useState("");
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const [discount, setDiscount] = useState(0);

  const handleApplyCoupon = async () => {
    if (!coupon) return;
    try {
      const res = await applyCartCoupon(coupon);
      // server returns updated cart with coupon info
      setCart(res.data);
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

  const loadRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () =>
        reject(new Error("Failed to load Razorpay script"));
      document.body.appendChild(script);
    });

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const payload = {
        items: cart.items.map((i) => ({
          productId: i.productId._id || i.productId,
          variantId: i.variantId,
          qty: i.qty,
          price: i.price,
        })),
        shipping: { cost: 0 },
        couponCode: coupon || null,
        paymentMethod: "razorpay",
      };
      const res = await createCheckout(payload);
      const { order, razorpayOrder, razorpayKeyId } = res.data;
      if (!razorpayOrder) {
        // Non-razorpay flow (e.g., COD) - just navigate to order
        navigate(`/orders/${order._id}`);
        return;
      }
      await loadRazorpay();
      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "CosmeticsApp",
        description: `Order ${order._id}`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          // verify with backend
          try {
            await verifyPayment({
              orderId: order._id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate(`/orders/${order._id}`);
          } catch (e) {
            console.error("Verification failed", e);
            alert(
              "Payment verification failed. We will reconcile and notify you."
            );
          }
        },
        prefill: { name: "", email: "" },
        theme: { color: "#4f46e5" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("Checkout error", e);
      alert("Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-6">Loading cart...</div>;
  if (!cart || !(cart.items && cart.items.length))
    return <div className="p-6">Cart is empty</div>;

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
                  await load();
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
              onClick={handleCheckout}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded"
            >
              {processing ? "Processing..." : "Checkout with Razorpay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
