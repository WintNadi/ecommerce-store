import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from './store/slices/authSlice';

// Layout
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

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

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
import ProductsPage from './pages/admin/ProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import UsersPage from './pages/admin/UsersPage';

// ✅ Seller Pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, accessToken]);

  // ✅ Role-based redirect for home page
  const getHomeRedirect = () => {
    if (!isAuthenticated) return '/';
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'seller') return '/seller/dashboard';
    return '/';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />

          {/* Auth Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* ✅ User Routes - Any Authenticated User */}
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<OrderHistoryPage />} />
            <Route path="orders/:id" element={<OrderDetailsPage />} />
            <Route path="orders/:id/tracking" element={<OrderTrackingPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
          </Route>

          {/* ✅ Admin Routes - Admin Only */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="admin" element={<DashboardPage />} />
            <Route path="admin/orders" element={<OrdersPage />} />
            <Route path="admin/products" element={<ProductsPage />} />
            <Route path="admin/products/create" element={<ProductFormPage />} />
            <Route path="admin/products/edit/:id" element={<ProductFormPage />} />
            <Route path="admin/users" element={<UsersPage />} />
          </Route>

          {/* ✅ Seller Routes - Seller Only (Admin also has access) */}
          <Route element={<ProtectedRoute sellerOnly />}>
            <Route path="seller/dashboard" element={<SellerDashboardPage />} />
            <Route path="seller/products" element={<SellerProductsPage />} />
            <Route path="seller/products/create" element={<ProductFormPage />} />
            <Route path="seller/products/edit/:id" element={<ProductFormPage />} />
            <Route path="seller/orders" element={<SellerOrdersPage />} />
          </Route>

          {/* 404 */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;