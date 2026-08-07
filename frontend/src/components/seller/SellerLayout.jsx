import React from 'react';
import { Outlet } from 'react-router-dom';
import SellerHeader from './SellerHeader';
import Footer from '../common/Footer';

const SellerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <SellerHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default SellerLayout;