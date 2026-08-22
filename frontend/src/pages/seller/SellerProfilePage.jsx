import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Store, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Upload,
  Building
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SellerProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    sellerProfile: {
      storeName: '',
      storeDescription: '',
      storeCategory: 'other',
      storeAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Myanmar'
      },
      socialLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        website: ''
      },
      businessLicense: '',
      taxId: '',
      isStoreActive: true
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        sellerProfile: {
          storeName: user.sellerProfile?.storeName || '',
          storeDescription: user.sellerProfile?.storeDescription || '',
          storeCategory: user.sellerProfile?.storeCategory || 'other',
          storeAddress: {
            street: user.sellerProfile?.storeAddress?.street || '',
            city: user.sellerProfile?.storeAddress?.city || '',
            state: user.sellerProfile?.storeAddress?.state || '',
            zipCode: user.sellerProfile?.storeAddress?.zipCode || '',
            country: user.sellerProfile?.storeAddress?.country || 'Myanmar'
          },
          socialLinks: {
            facebook: user.sellerProfile?.socialLinks?.facebook || '',
            instagram: user.sellerProfile?.socialLinks?.instagram || '',
            twitter: user.sellerProfile?.socialLinks?.twitter || '',
            youtube: user.sellerProfile?.socialLinks?.youtube || '',
            website: user.sellerProfile?.socialLinks?.website || ''
          },
          businessLicense: user.sellerProfile?.businessLicense || '',
          taxId: user.sellerProfile?.taxId || '',
          isStoreActive: user.sellerProfile?.isStoreActive !== false
        }
      });
    }
  }, [user]);

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'home', label: 'Home & Living' },
    { value: 'books', label: 'Books & Media' },
    { value: 'beauty', label: 'Beauty & Cosmetics' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'storeAddress' || parent === 'socialLinks') {
        setFormData(prev => ({
          ...prev,
          sellerProfile: {
            ...prev.sellerProfile,
            [parent]: {
              ...prev.sellerProfile[parent],
              [child]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        sellerProfile: {
          ...prev.sellerProfile,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'logo') {
        setPreviewLogo(URL.createObjectURL(file));
      } else if (type === 'banner') {
        setPreviewBanner(URL.createObjectURL(file));
      }
      // Handle file upload separately
      handleImageUpload(file, type);
    }
  };

  const handleImageUpload = async (file, type) => {
    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();
      formDataToSend.append('image', file);
      formDataToSend.append('type', type);

      const response = await axios.post(
        `${API_URL}/auth/upload-store-image`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const imageUrl = response.data.data.url;
      setFormData(prev => ({
        ...prev,
        sellerProfile: {
          ...prev.sellerProfile,
          [type === 'logo' ? 'storeLogo' : 'storeBanner']: imageUrl
        }
      }));

      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully`);
    } catch (err) {
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_URL}/auth/seller-profile`,
        formData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      // Update user data
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Store className="h-6 w-6 text-orange-500" />
              Seller Profile
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your store profile and settings
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <ErrorMessage
            error={error}
            variant="error"
            title="Failed to update profile"
            onClear={() => setError(null)}
          />
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Banner */}
          <div className="relative h-48 bg-gradient-to-r from-navy-500 to-navy-700 dark:from-navy-700 dark:to-navy-900">
            {formData.sellerProfile.storeBanner && (
              <img
                src={formData.sellerProfile.storeBanner}
                alt="Store banner"
                className="w-full h-full object-cover"
              />
            )}
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center text-white">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm mt-1">Change Banner</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'banner')}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Store Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Store className="h-5 w-5 text-orange-500" />
                    Store Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Store Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="sellerProfile.storeName"
                          value={formData.sellerProfile.storeName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white font-medium">
                          {formData.sellerProfile.storeName || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      {isEditing ? (
                        <select
                          name="sellerProfile.storeCategory"
                          value={formData.sellerProfile.storeCategory}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300">
                          {categories.find(c => c.value === formData.sellerProfile.storeCategory)?.label || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Store Description
                    </label>
                    {isEditing ? (
                      <textarea
                        name="sellerProfile.storeDescription"
                        value={formData.sellerProfile.storeDescription}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        {formData.sellerProfile.storeDescription || 'No description provided'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Personal Info */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-500" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">{formData.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900 dark:text-white">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300">{formData.phone || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bio
                      </label>
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400">{formData.bio || 'No bio provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    Store Address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Street
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="sellerProfile.storeAddress.street"
                          value={formData.sellerProfile.storeAddress.street}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.sellerProfile.storeAddress.street || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="sellerProfile.storeAddress.city"
                          value={formData.sellerProfile.storeAddress.city}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.sellerProfile.storeAddress.city || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State/Province
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="sellerProfile.storeAddress.state"
                          value={formData.sellerProfile.storeAddress.state}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.sellerProfile.storeAddress.state || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Zip Code
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="sellerProfile.storeAddress.zipCode"
                          value={formData.sellerProfile.storeAddress.zipCode}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.sellerProfile.storeAddress.zipCode || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="sellerProfile.storeAddress.country"
                          value={formData.sellerProfile.storeAddress.country}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.sellerProfile.storeAddress.country || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="h-5 w-5 text-orange-500" />
                    Social Links
                  </h3>
                  <div className="space-y-3 mt-4">
                    {[
                      { key: 'facebook', icon: Facebook, color: 'text-blue-600' },
                      { key: 'instagram', icon: Instagram, color: 'text-pink-600' },
                      { key: 'twitter', icon: Twitter, color: 'text-blue-400' },
                      { key: 'youtube', icon: Youtube, color: 'text-red-600' },
                      { key: 'website', icon: Globe, color: 'text-gray-500' }
                    ].map(({ key, icon: Icon, color }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${color}`} />
                        {isEditing ? (
                          <input
                            type="url"
                            placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} URL`}
                            value={formData.sellerProfile.socialLinks[key] || ''}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                sellerProfile: {
                                  ...prev.sellerProfile,
                                  socialLinks: {
                                    ...prev.sellerProfile.socialLinks,
                                    [key]: e.target.value
                                  }
                                }
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                          />
                        ) : (
                          <a
                            href={formData.sellerProfile.socialLinks[key] || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-navy-600 dark:text-navy-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                          >
                            {formData.sellerProfile.socialLinks[key] || 'Not set'}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Buttons */}
                {isEditing && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      {loading ? (
                        <Loader size="sm" text="Saving..." />
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Store Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{user.sellerProfile?.totalProducts || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{user.sellerProfile?.totalSales || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{user.sellerProfile?.rating || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className={`text-2xl font-bold ${user.sellerProfile?.isStoreActive ? 'text-green-500' : 'text-red-500'}`}>
              {user.sellerProfile?.isStoreActive ? 'Active' : 'Inactive'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Store Status</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfilePage;