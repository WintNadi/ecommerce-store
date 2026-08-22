import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ adminOnly = false, sellerOnly = false }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Admin only routes
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // ✅ Seller only routes (Admin can also access seller routes)
  if (sellerOnly && user?.role !== 'seller' && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;