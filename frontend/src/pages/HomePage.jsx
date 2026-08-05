import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts } from '../store/slices/productSlice';
import ProductCard from '../components/products/ProductCard';
import { ArrowRight, ShoppingBag, Star, Truck, Shield, Clock, Sparkles, Zap, Gift } from 'lucide-react';
const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, isLoading } = useSelector((state) => state.products);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // ============================================
  // ROLE-BASED REDIRECT
  // ============================================
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'seller') {
        navigate('/seller/dashboard');
      }
      // User role stays on home page
    }
  }, [isAuthenticated, user, navigate]);

  // ============================================
  // FETCH PRODUCTS
  // ============================================
  useEffect(() => {
    dispatch(getProducts({ page: 1, limit: 8 }));
  }, [dispatch]);

  // ============================================
  // FEATURES DATA
  // ============================================
  const features = [
    { 
      icon: Truck, 
      title: 'Free Shipping', 
      description: 'On orders over $50',
      color: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      icon: Shield, 
      title: 'Secure Payment', 
      description: '100% secure checkout',
      color: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    { 
      icon: Star, 
      title: 'Quality Products', 
      description: 'Premium quality guaranteed',
      color: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    { 
      icon: Clock, 
      title: '24/7 Support', 
      description: 'Dedicated customer service',
      color: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
  ];

  // ============================================
  // CATEGORIES DATA
  // ============================================
  const categories = [
    { name: 'Electronics', icon: '📱', color: 'from-blue-500 to-cyan-500' },
    { name: 'Fashion', icon: '👕', color: 'from-pink-500 to-rose-500' },
    { name: 'Home & Living', icon: '🏠', color: 'from-emerald-500 to-teal-500' },
    { name: 'Books', icon: '📚', color: 'from-orange-500 to-amber-500' },
    { name: 'Sports', icon: '⚽', color: 'from-red-500 to-orange-500' },
    { name: 'Beauty', icon: '💄', color: 'from-purple-500 to-pink-500' },
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      
      {/* ============================================
          HERO SECTION
      ============================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 lg:py-32 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                New Arrivals Weekly
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                Discover Amazing
                <span className="block text-yellow-300">Products</span>
                at Great Prices
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-indigo-100 max-w-lg mx-auto lg:mx-0">
                Shop the latest trends and best deals. From electronics to fashion, we have everything you need.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  to="/shop"
                  className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
                >
                  Start Shopping
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all border border-white/30"
                  >
                    Create Account
                  </Link>
                )}
              </div>
              {/* Stats */}
              <div className="mt-8 flex gap-8 justify-center lg:justify-start">
                <div>
                  <p className="text-2xl font-bold text-white">10K+</p>
                  <p className="text-sm text-indigo-200">Products</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">5K+</p>
                  <p className="text-sm text-indigo-200">Happy Customers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">4.9★</p>
                  <p className="text-sm text-indigo-200">Average Rating</p>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 blur-3xl opacity-20 rounded-full"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <ShoppingBag className="h-48 w-48 text-white/30" />
                </div>
                {/* Floating Badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2 animate-bounce">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-bold text-gray-900">-20% OFF</span>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-bold text-gray-900">Free Gift</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120H0Z" fill="currentColor" className="text-gray-50 dark:text-gray-900"/>
          </svg>
        </div>
      </section>

      {/* ============================================
          FEATURES SECTION
      ============================================ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Why Choose Us
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We provide the best shopping experience for our customers
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          CATEGORIES SECTION
      ============================================ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Shop by Category
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Browse our top categories
            </p>
          </div>
          <Link
            to="/shop"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/shop?category=${category.name}`}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} p-6 text-center min-h-[120px] flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300`}
            >
              <span className="text-4xl mb-2">{category.icon}</span>
              <span className="text-sm font-semibold text-white">{category.name}</span>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================
          FEATURED PRODUCTS
      ============================================ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Products
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Handpicked just for you
            </p>
          </div>
          <Link
            to="/shop"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-2xl"></div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No products available at the moment.</p>
          </div>
        )}
      </section>

      {/* ============================================
          CTA SECTION
      ============================================ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Shopping?
            </h2>
            <p className="text-indigo-100 max-w-2xl mx-auto mb-8">
              Join thousands of happy customers and discover amazing products at unbeatable prices.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/shop"
                className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
              >
                Browse Products
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all border border-white/30"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;