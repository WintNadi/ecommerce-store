import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Store, 
  Star, 
  MapPin, 
  Globe, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  ShoppingBag,
  Package,
  Users,
  Heart,
  Mail,
  Phone
} from 'lucide-react';
import axios from 'axios';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import ProductCard from '../components/products/ProductCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SellerStorePage = () => {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get seller info
        const sellerResponse = await axios.get(`${API_URL}/auth/seller/${id}`);
        setSeller(sellerResponse.data.data);

        // Get seller products
        const productsResponse = await axios.get(`${API_URL}/products?seller=${id}`);
        setProducts(productsResponse.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load store');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSellerData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader size="lg" text="Loading store..." />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <ErrorMessage
            error={error || 'Store not found'}
            variant="error"
            title="Store Not Found"
            onClear={() => {}}
          />
        </div>
      </div>
    );
  }

  const { sellerProfile, name, email, phone, bio, profileImage } = seller;
  const {
    storeName,
    storeDescription,
    storeLogo,
    storeBanner,
    storeAddress,
    socialLinks,
    rating,
    totalSales,
    totalProducts,
    isStoreActive
  } = sellerProfile || {};

  const renderStars = (ratingValue) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(ratingValue || 0)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-navy-500 to-navy-700 dark:from-navy-700 dark:to-navy-900">
        {storeBanner && (
          <img
            src={storeBanner}
            alt={`${storeName} banner`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Store Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto flex items-end gap-4">
            {/* Logo */}
            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 overflow-hidden shadow-lg flex-shrink-0">
              {storeLogo ? (
                <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                  <Store className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="text-white">
              <h1 className="text-2xl font-bold">{storeName || 'Store Name'}</h1>
              <div className="flex items-center gap-3 mt-1">
                {renderStars(rating)}
                <span className="text-sm text-white/80">({rating || 0})</span>
                <span className="text-sm text-white/60">•</span>
                <span className="text-sm text-white/80">{totalSales || 0} sales</span>
                <span className="text-sm text-white/60">•</span>
                <span className="text-sm text-white/80">{totalProducts || 0} products</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {isStoreActive ? (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-500 rounded-full">Active</span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-500 rounded-full">Inactive</span>
                )}
                <span className="text-sm text-white/60">
                  Joined {new Date(sellerProfile?.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Store Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About Store</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {storeDescription || 'No description provided.'}
              </p>
            </div>

            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact</h3>
              <div className="space-y-2 text-sm">
                {email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span>{email}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{phone}</span>
                  </div>
                )}
                {storeAddress && storeAddress.city && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[storeAddress.city, storeAddress.state, storeAddress.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            {socialLinks && Object.values(socialLinks).some(link => link) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Follow Us</h3>
                <div className="flex gap-3">
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:hover:text-blue-400"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-700 dark:hover:text-pink-400"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-500"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a
                      href={socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-700 dark:hover:text-red-400"
                    >
                      <Youtube className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.website && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 text-center border border-gray-200 dark:border-gray-700">
                <Package className="h-5 w-5 text-orange-500 mx-auto" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{totalProducts || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Products</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 text-center border border-gray-200 dark:border-gray-700">
                <ShoppingBag className="h-5 w-5 text-green-500 mx-auto" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{totalSales || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sales</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 text-center border border-gray-200 dark:border-gray-700">
                <Users className="h-5 w-5 text-blue-500 mx-auto" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{rating || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Products from {storeName || 'Store'}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {products.length} products
              </span>
            </div>

            {products.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center border border-gray-200 dark:border-gray-700">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No products found in this store.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerStorePage;