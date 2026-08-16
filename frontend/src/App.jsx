import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from './store/slices/authSlice';

// Layout Components
import Layout from './components/common/Layout';
import SellerLayout from './components/seller/SellerLayout';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import ProfilePage from './pages/user/ProfilePage';
import OrderHistoryPage from './pages/user/OrderHistoryPage';
import OrderDetailsPage from './pages/user/OrderDetailsPage';
import OrderTrackingPage from './pages/user/OrderTrackingPage';
import WishlistPage from './pages/user/WishlistPage';

// Public Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import NotFoundPage from './pages/NotFoundPage';
import SellerStorePage from './pages/SellerStorePage';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
import ProductsPage from './pages/admin/ProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import UsersPage from './pages/admin/UsersPage';
import CouponManagement from './pages/admin/CouponManagement';
import RefundManagement from './pages/admin/RefundManagement';
import ReviewModeration from './pages/admin/ReviewModeration';

// Seller Pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerProductForm from './pages/seller/SellerProductForm';
import SellerCouponManagement from './pages/seller/SellerCouponManagement';
import SellerProfilePage from './pages/seller/SellerProfilePage';
import SellerRegistrationPage from './pages/seller/SellerRegistrationPage';

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, accessToken]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================
            PUBLIC ROUTES WITH LAYOUT
            ============================================ */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="seller/:id" element={<SellerStorePage />} />

          {/* Auth Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Protected User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<OrderHistoryPage />} />
            <Route path="orders/:id" element={<OrderDetailsPage />} />
            <Route path="orders/:id/tracking" element={<OrderTrackingPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
          </Route>

          {/* 404 & Catch-all */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>

        {/* ============================================
            SELLER ROUTES (Public - Registration)
            ============================================ */}
        <Route path="/seller/register" element={<SellerRegistrationPage />} />

        {/* ============================================
            SELLER ROUTES (Protected)
            ============================================ */}
        <Route element={<ProtectedRoute sellerOnly />}>
          <Route path="/seller" element={<SellerLayout />}>
            <Route index element={<Navigate to="/seller/dashboard" replace />} />
            <Route path="dashboard" element={<SellerDashboardPage />} />
            <Route path="products" element={<SellerProductsPage />} />
            <Route path="products/create" element={<SellerProductForm />} />
            <Route path="products/edit/:id" element={<SellerProductForm />} />
            <Route path="orders" element={<SellerOrdersPage />} />
            <Route path="coupons" element={<SellerCouponManagement />} />
            <Route path="profile" element={<SellerProfilePage />} />
          </Route>
        </Route>

        {/* ============================================
            ADMIN ROUTES (Protected)
            ============================================ */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/create" element={<ProductFormPage />} />
            <Route path="products/edit/:id" element={<ProductFormPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="coupons" element={<CouponManagement />} />
            <Route path="refunds" element={<RefundManagement />} />
            <Route path="reviews" element={<ReviewModeration />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;