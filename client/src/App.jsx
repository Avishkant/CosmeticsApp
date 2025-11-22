import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Products from "./pages/Products";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OrderDetail from "./pages/OrderDetail";
import AdminUpload from "./pages/AdminUpload";
import AdminPayments from "./pages/AdminPayments";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";
import AdminHome from "./pages/AdminHome";
import AdminBrands from "./pages/AdminBrands";
import Brands from "./pages/Brands";
import LipCare from "./pages/LipCare";
import SkinCare from "./pages/SkinCare";
import Hair from "./pages/Hair";
import Makeup from "./pages/MakeupPage";
import Fragrance from "./pages/Fragrance";
import AdminCategories from "./pages/AdminCategories";
import AdminUsers from "./pages/AdminUsers";
import AdminCoupons from "./pages/AdminCoupons";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";
import { ToastProvider } from "./components/ToastProvider";
import { ConfirmProvider } from "./components/ConfirmProvider";

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/skin-care" element={<SkinCare />} />
            <Route path="/hair" element={<Hair />} />
            <Route path="/makeup" element={<Makeup />} />
            <Route path="/fragrance" element={<Fragrance />} />
            <Route path="/lip-care" element={<LipCare />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/admin-upload" element={<AdminUpload />} />
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/brands" element={<AdminBrands />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/account" element={<Account />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
