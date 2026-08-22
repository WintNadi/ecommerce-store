import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import {
  LayoutDashboardIcon,
  ShoppingBagIcon,
  PackageIcon,
  TicketIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  HomeIcon,
  StoreIcon,
  UsersIcon
} from 'lucide-react';

const SellerLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    { path: '/seller/dashboard', icon: LayoutDashboardIcon, label: 'Dashboard' },
    { path: '/seller/products', icon: ShoppingBagIcon, label: 'Products' },
    { path: '/seller/orders', icon: PackageIcon, label: 'Orders' },
    { path: '/seller/coupons', icon: TicketIcon, label: 'Coupons' },
    { path: '/seller/profile', icon: SettingsIcon, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`bg-navy-500 dark:bg-navy-700 text-white transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } flex-shrink-0 flex flex-col min-h-screen sticky top-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {isSidebarOpen ? (
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">🏪 Seller</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-white mx-auto">🏪</span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isSidebarOpen ? (
              <ChevronLeftIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/seller/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 p-4 space-y-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5 flex-shrink-0" />
            ) : (
              <MoonIcon className="h-5 w-5 flex-shrink-0" />
            )}
            {isSidebarOpen && <span className="text-sm font-medium">Dark Mode</span>}
          </button>

          {/* Back to Store */}
          <NavLink
            to="/"
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <HomeIcon className="h-5 w-5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Back to Store</span>}
          </NavLink>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-500/20 transition-colors text-white/70 hover:text-red-400"
          >
            <LogOutIcon className="h-5 w-5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between transition-colors duration-200">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              Seller Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back, {user?.name || 'Seller'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-200">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;