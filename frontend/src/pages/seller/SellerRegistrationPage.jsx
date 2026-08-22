import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Upload,
  X,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building,
  FileText,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SellerRegistrationPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: '',

    // Step 2: Store Info
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

    // Step 3: Social & Business
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      website: ''
    },
    businessLicense: '',
    taxId: '',
    storeLogo: null,
    storeBanner: null
  });

  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

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
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (type === 'file') {
      const file = e.target.files[0];
      if (file) {
        if (name === 'storeLogo') {
          setPreviewLogo(URL.createObjectURL(file));
        } else if (name === 'storeBanner') {
          setPreviewBanner(URL.createObjectURL(file));
        }
        setFormData(prev => ({ ...prev, [name]: file }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSocialChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const validateStep = () => {
    setError(null);

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Please enter your email address');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Please enter your phone number');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (!formData.storeName.trim()) {
        setError('Please enter your store name');
        return false;
      }
      if (formData.storeDescription.length < 20) {
        setError('Store description must be at least 20 characters');
        return false;
      }
      if (!formData.storeAddress.city.trim()) {
        setError('Please enter your store city');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Prepare form data
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        sellerProfile: {
          storeName: formData.storeName,
          storeDescription: formData.storeDescription,
          storeCategory: formData.storeCategory,
          storeAddress: formData.storeAddress,
          socialLinks: formData.socialLinks,
          businessLicense: formData.businessLicense,
          taxId: formData.taxId,
          isStoreActive: true,
          isOnboarded: true,
          onBoardingStep: 0
        }
      };

      // Handle file uploads
      const formDataToSend = new FormData();
      formDataToSend.append('data', JSON.stringify(submitData));
      
      if (formData.storeLogo) {
        formDataToSend.append('storeLogo', formData.storeLogo);
      }
      if (formData.storeBanner) {
        formDataToSend.append('storeBanner', formData.storeBanner);
      }

      const response = await axios.put(
        `${API_URL}/auth/seller-profile`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Store registered successfully! 🎉');
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register store');
      toast.error(err.response?.data?.message || 'Failed to register store');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            Please Login First
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            You need to be logged in to register as a seller.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Store className="h-12 w-12 text-orange-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Become a Seller
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Start selling your products on our platform
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep > step
                    ? 'bg-green-500 text-white'
                    : currentStep === step
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {step === 1 ? 'Personal' : step === 2 ? 'Store' : 'Social'}
                </span>
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  currentStep > step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Personal Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  required
                  disabled
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+959123456789"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Store Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-500" />
                Store Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="My Awesome Store"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store Description *
                </label>
                <textarea
                  name="storeDescription"
                  value={formData.storeDescription}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe your store and what you sell..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.storeDescription.length}/1000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store Category *
                </label>
                <select
                  name="storeCategory"
                  value={formData.storeCategory}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store Address *
                </label>
                <input
                  type="text"
                  name="storeAddress.street"
                  value={formData.storeAddress.street}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="storeAddress.city"
                    value={formData.storeAddress.city}
                    onChange={handleChange}
                    placeholder="City *"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  />
                  <input
                    type="text"
                    name="storeAddress.state"
                    value={formData.storeAddress.state}
                    onChange={handleChange}
                    placeholder="State/Province"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  />
                  <input
                    type="text"
                    name="storeAddress.zipCode"
                    value={formData.storeAddress.zipCode}
                    onChange={handleChange}
                    placeholder="Zip Code"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  />
                  <input
                    type="text"
                    name="storeAddress.country"
                    value={formData.storeAddress.country}
                    onChange={handleChange}
                    placeholder="Country"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Social & Business */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-500" />
                Social & Business
              </h2>

              {/* Social Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Social Links
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <input
                      type="url"
                      placeholder="Facebook URL"
                      value={formData.socialLinks.facebook}
                      onChange={(e) => handleSocialChange('facebook', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-600" />
                    <input
                      type="url"
                      placeholder="Instagram URL"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => handleSocialChange('instagram', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-blue-400" />
                    <input
                      type="url"
                      placeholder="Twitter URL"
                      value={formData.socialLinks.twitter}
                      onChange={(e) => handleSocialChange('twitter', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-600" />
                    <input
                      type="url"
                      placeholder="YouTube URL"
                      value={formData.socialLinks.youtube}
                      onChange={(e) => handleSocialChange('youtube', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <input
                      type="url"
                      placeholder="Website URL"
                      value={formData.socialLinks.website}
                      onChange={(e) => handleSocialChange('website', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Business Docs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Information
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Business License
                    </label>
                    <input
                      type="text"
                      name="businessLicense"
                      value={formData.businessLicense}
                      onChange={handleChange}
                      placeholder="Enter business license number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Tax ID / GST Number
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleChange}
                      placeholder="Enter tax ID or GST number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Store Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Store Logo
                  </label>
                  <div className="relative">
                    {previewLogo ? (
                      <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img src={previewLogo} alt="Logo preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewLogo(null);
                            setFormData(prev => ({ ...prev, storeLogo: null }));
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload Logo</span>
                        </div>
                        <input
                          type="file"
                          name="storeLogo"
                          accept="image/*"
                          onChange={handleChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Store Banner
                  </label>
                  <div className="relative">
                    {previewBanner ? (
                      <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img src={previewBanner} alt="Banner preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewBanner(null);
                            setFormData(prev => ({ ...prev, storeBanner: null }));
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload Banner</span>
                        </div>
                        <input
                          type="file"
                          name="storeBanner"
                          accept="image/*"
                          onChange={handleChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loading ? (
                    <Loader size="sm" text="Registering..." />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Register Store
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SellerRegistrationPage;