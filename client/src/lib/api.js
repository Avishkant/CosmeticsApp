import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE + "/api",
  headers: { "Content-Type": "application/json" },
});

// attach Authorization header from localStorage for each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token)
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  return config;
});

// Response interceptor to handle 401: try refresh token flow then retry original request
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (!originalRequest || !err.response) return Promise.reject(err);

    // If 401, try to refresh
    if (err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        // no refresh token — force logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(err);
      }

      if (isRefreshing) {
        // queue the request until refresh completes
        return new Promise(function (resolve, reject) {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((e) => Promise.reject(e));
      }

      isRefreshing = true;
      try {
        const r = await axios.post(API_BASE + "/api/auth/refresh", {
          token: refresh,
        });
        const { access, refresh: newRefresh } = r.data.data || r.data || {};
        if (access) {
          localStorage.setItem("access", access);
          if (newRefresh) localStorage.setItem("refresh", newRefresh);
          processQueue(null, access);
          originalRequest.headers["Authorization"] = `Bearer ${access}`;
          return api(originalRequest);
        }
        throw new Error("Refresh did not return access token");
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export async function fetchProducts(params = {}) {
  const res = await api.get("/products", { params });
  return res.data;
}

export async function fetchProductBySlug(slug) {
  const res = await api.get(`/products/slug/${encodeURIComponent(slug)}`);
  return res.data;
}

export async function addToCart(payload) {
  const res = await api.post("/cart", payload);
  return res.data;
}

export async function getCart() {
  const res = await api.get("/cart");
  return res.data;
}

export async function updateCartQuantity(payload) {
  // payload: { productId, variantId, qty, price }
  const res = await api.post("/cart", payload);
  return res.data;
}

export async function createCheckout(payload) {
  // payload: { items, shipping, couponCode, paymentMethod }
  const res = await api.post("/orders/checkout", payload);
  return res.data;
}

export async function verifyPayment(payload) {
  // payload: { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature }
  const res = await api.post("/orders/verify", payload);
  return res.data;
}

export async function removeCartItem(itemId) {
  const res = await api.delete(`/cart/${itemId}`);
  return res.data;
}

export async function uploadProductsCSV(formData) {
  const res = await api.post("/admin/products/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function validateCoupon(code, subtotal) {
  const res = await api.post("/coupons/validate", { code, subtotal });
  return res.data;
}

export async function applyCartCoupon(code) {
  const res = await api.post("/cart/coupon", { code });
  return res.data;
}

export async function removeCartCoupon() {
  const res = await api.delete("/cart/coupon");
  return res.data;
}

export async function fetchOrder(id) {
  const res = await api.get(`/orders/${id}`);
  return res.data;
}

export async function reconcileOrder(orderId) {
  const res = await api.post(`/admin/orders/reconcile/${orderId}`);
  return res.data;
}

export async function fetchAuditLogs() {
  const res = await api.get("/admin/audit");
  return res.data;
}

export default api;
