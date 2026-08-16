import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import Toast from './Toast';
import { useSelector } from 'react-redux';

const Layout = () => {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Check if current path is auth page (hide breadcrumbs on login/register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumbs */}
        {!isAuthPage && (
          <div className="mb-4">
            <Breadcrumbs />
          </div>
        )}

        {/* Page Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-200">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
};

export default Layout;