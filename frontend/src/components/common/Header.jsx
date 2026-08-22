import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { items } = useSelector(state => state.cart);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check initial dark mode preference
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle dark mode
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
    setIsDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const cartCount = items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <header className="bg-navy-500 dark:bg-navy-700 text-white shadow-lg sticky top-0 z-50 transition-colors duration-200">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo / Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white hover:text-orange-400 transition-colors">
                🏪 Shop Store
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-all"
            >
              Home
            </Link>
            <Link 
              to="/shop" 
              className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-all"
            >
              Shop
            </Link>
            <Link 
              to="/about" 
              className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-all"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-all"
            >
              Contact
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-white/5 text-white placeholder:text-white/50 border border-white/20 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-orange-400 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5 text-yellow-400" />
              ) : (
                <MoonIcon className="h-5 w-5 text-white" />
              )}
            </button>

            {/* Cart */}
            <Link 
              to="/cart" 
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu / Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {user.name?.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/my-orders"
                      className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      My Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-orange-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="space-y-3">
              <Link
                to="/"
                className="block text-white/80 hover:text-white px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/shop"
                className="block text-white/80 hover:text-white px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                to="/about"
                className="block text-white/80 hover:text-white px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="block text-white/80 hover:text-white px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-white/5 text-white placeholder:text-white/50 border border-white/20 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-orange-400 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;