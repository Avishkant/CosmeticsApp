import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getCart,
  addToCart as apiAddToCart,
  removeCartItem as apiRemoveCartItem,
  updateCartQuantity as apiUpdateCartQuantity,
} from "../lib/api";
import { isAuthenticated } from "../lib/auth";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], coupon: null });
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated()) {
        setCart({ items: [] });
        setLoading(false);
        return;
      }
      const res = await getCart();
      setCart(res.data || { items: [] });
    } catch (e) {
      setCart({ items: [] });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = async (payload) => {
    // optimistic update
    setCart((c) => {
      const items = c.items ? [...c.items] : [];
      const existing = items.find(
        (i) =>
          String(i.productId._id || i.productId) ===
            String(payload.productId) &&
          String(i.variantId || "") === String(payload.variantId || "")
      );
      if (existing) {
        existing.qty = payload.qty || existing.qty || 1;
        return { ...c, items };
      }
      items.push({
        productId: payload.productId,
        variantId: payload.variantId,
        qty: payload.qty || 1,
        price: payload.price,
        _id: `local-${Date.now()}`,
      });
      return { ...c, items };
    });

    try {
      const res = await apiAddToCart(payload);
      setCart(res.data);
      return res.data;
    } catch (e) {
      // rollback by reloading from server
      await loadCart();
      throw e;
    }
  };

  const removeItem = async (itemId) => {
    await apiRemoveCartItem(itemId);
    await loadCart();
  };

  const updateQty = async (payload) => {
    await apiUpdateCartQuantity(payload);
    await loadCart();
  };

  return (
    <CartContext.Provider
      value={{ cart, loading, loadCart, addItem, removeItem, updateQty }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

export default CartContext;
