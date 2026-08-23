import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createProduct,
  getProductById,
  updateProduct,
  clearProduct
} from '../../store/slices/productSlice';
import ProductImageUpload from '../../components/products/ProductImageUpload';
import {
  Save,
  X,
  ArrowLeft,
  Loader2,
  Package,
  DollarSign,
  Tag,
  List,
  Image,
  Box,
  AlertCircle,
  CheckCircle,
  Calendar,
  Percent,
  Clock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// ============================================
// FORM VALIDATION SCHEMA
// ============================================

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  comparePrice: z.number().min(0).optional(),
  stock: z.number().min(0, 'Stock must be 0 or more'),
  brand: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
  discountStartDate: z.string().optional(),
  discountEndDate: z.string().optional(),
});

const SellerProductForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { user } = useSelector((state) => state.auth);
  const { selectedProduct, isLoading, error } = useSelector((state) => state.products);

  // ============================================
  // STATE
  // ============================================

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    stock: '',
    brand: '',
    color: '',
    material: '',
    tags: [],
    images: [],
    discount: '',
    discountStartDate: '',
    discountEndDate: '',
    isPublished: false,
    isFeatured: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [productId, setProductId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [discountType, setDiscountType] = useState('percentage');
  const [showDiscountFields, setShowDiscountFields] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
    watch,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      comparePrice: '',
      stock: '',
      brand: '',
      color: '',
      material: '',
      discount: '',
      discountStartDate: '',
      discountEndDate: '',
    },
  });

  // Watch discount value for display
  const discountValue = watch('discount');
  const priceValue = watch('price');

  // ============================================
  // CALCULATE DISCOUNTED PRICE
  // ============================================
  const calculateDiscountedPrice = () => {
    if (!priceValue || !discountValue) return null;
    const price = parseFloat(priceValue);
    const discount = parseFloat(discountValue);
    if (isNaN(price) || isNaN(discount) || discount <= 0) return null;
    const discountedPrice = price * (1 - discount / 100);
    return discountedPrice.toFixed(2);
  };

  // ============================================
  // LOAD PRODUCT DATA (Edit Mode)
  // ============================================

  useEffect(() => {
    if (isEditMode && id) {
      console.log('🔍 Loading product with ID:', id);
      dispatch(getProductById(id));
    } else {
      dispatch(clearProduct());
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (selectedProduct && isEditMode) {
      const product = selectedProduct;
      
      const data = {
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        comparePrice: product.comparePrice || '',
        stock: product.stock || '',
        brand: product.brand || '',
        color: product.color || '',
        material: product.material || '',
        tags: product.tags || [],
        images: product.images || [],
        discount: product.discount || '',
        discountStartDate: product.discountStartDate ? new Date(product.discountStartDate).toISOString().split('T')[0] : '',
        discountEndDate: product.discountEndDate ? new Date(product.discountEndDate).toISOString().split('T')[0] : '',
        isPublished: product.isPublished || false,
        isFeatured: product.isFeatured || false,
      };

      setFormData(data);
      setProductId(product._id);
      
      if (product.discount && product.discount > 0) {
        setShowDiscountFields(true);
      }

      Object.keys(data).forEach((key) => {
        if (key !== 'images' && key !== 'tags' && key !== 'isPublished' && key !== 'isFeatured') {
          setValue(key, data[key]);
        }
      });

      if (product.tags) {
        setFormData((prev) => ({ ...prev, tags: product.tags }));
      }
    }
  }, [selectedProduct, isEditMode, setValue]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    setValue(name, value);
    trigger(name);
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const handleImageUpload = (images) => {
    console.log('📸 Images updated:', images);
    setFormData((prev) => ({ ...prev, images }));
  };

  const handleFileSelect = (files) => {
    console.log('📁 Files selected:', files?.length || 0);
    setSelectedFiles(files || []);
  };

  const toggleDiscountFields = () => {
    setShowDiscountFields(!showDiscountFields);
    if (!showDiscountFields) {
      setFormData((prev) => ({ ...prev, discount: '', discountStartDate: '', discountEndDate: '' }));
      setValue('discount', '');
      setValue('discountStartDate', '');
      setValue('discountEndDate', '');
    }
  };

  // ============================================
  // UPLOAD IMAGES TO SUPABASE (FIXED)
  // ============================================

  const uploadImagesToSupabase = async (productIdForUpload, files) => {
    if (!files || files.length === 0) return [];
    if (!productIdForUpload || productIdForUpload === 'temp' || productIdForUpload === 'undefined') {
      throw new Error('Product ID is required to upload images. Please save the product first.');
    }

    console.log('📤 Uploading images to Supabase...', files.length);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('You must be logged in to upload images');
      }

      // ✅ Use VITE_API_URL from environment
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      console.log('📡 Sending to:', `${API_URL}/products/${productIdForUpload}/upload-images`);

      const response = await axios.post(
        `${API_URL}/products/${productIdForUpload}/upload-images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('✅ Images uploaded successfully:', response.data);
      return response.data.data?.imageUrls || [];
    } catch (error) {
      console.error('❌ Image upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload images');
    }
  };

  // ============================================
  // ✅ ON SUBMIT - With Debug Logs
  // ============================================

  const onSubmit = async (data) => {
    console.log('🟢 1. onSubmit called with data:', data);
    console.log('🟢 1a. isEditMode:', isEditMode);
    console.log('🟢 1b. productId:', productId);
    console.log('🟢 1c. selectedFiles:', selectedFiles?.length || 0);
    
    setIsSubmitting(true);
    setSaveSuccess(false);
    
    const loadingToast = toast.loading(isEditMode ? 'Updating product...' : 'Creating product...');
    console.log('🟢 2. Loading toast shown');

    try {
      // ✅ Validate required fields
      if (!data.name || data.name.trim() === '') {
        toast.error('Product name is required', { id: loadingToast });
        setIsSubmitting(false);
        return;
      }
      if (!data.description || data.description.trim() === '') {
        toast.error('Product description is required', { id: loadingToast });
        setIsSubmitting(false);
        return;
      }
      if (!data.price || data.price <= 0) {
        toast.error('Please enter a valid price', { id: loadingToast });
        setIsSubmitting(false);
        return;
      }
      if (data.stock === undefined || data.stock === null || data.stock < 0) {
        toast.error('Please enter a valid stock quantity', { id: loadingToast });
        setIsSubmitting(false);
        return;
      }

      console.log('🟢 3. Validation passed');

      let finalImageUrls = [];

      // Filter out blob URLs from existing images
      const existingValidImages = (formData.images || []).filter(
        (img) => img && typeof img === 'string' && !img.startsWith('blob:') && !img.startsWith('data:')
      );
      console.log('🟢 4. Existing valid images:', existingValidImages.length);

      // Upload new images if any
      if (selectedFiles && selectedFiles.length > 0) {
        console.log('🟢 5. Uploading new images to Supabase...');

        if (isEditMode && productId) {
          const uploadedUrls = await uploadImagesToSupabase(productId, selectedFiles);
          finalImageUrls = [...existingValidImages, ...uploadedUrls];
          console.log('🟢 6. Uploaded URLs:', finalImageUrls);
        } else {
          // For new products: create product first, then upload images
          const productData = {
            name: data.name,
            description: data.description,
            price: parseFloat(data.price),
            comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : undefined,
            stock: parseInt(data.stock),
            brand: data.brand || undefined,
            color: data.color || undefined,
            material: data.material || undefined,
            tags: formData.tags,
            images: [],
            discount: data.discount ? parseFloat(data.discount) : 0,
            discountStartDate: data.discountStartDate || null,
            discountEndDate: data.discountEndDate || null,
            isPublished: formData.isPublished || false,
            isFeatured: formData.isFeatured || false,
            seller: user?._id,
          };

          console.log('🟢 7. Creating new product...', productData);
          const result = await dispatch(createProduct(productData)).unwrap();
          console.log('🟢 8. Create result:', result);
          
          const newProductId = result?.data?._id;

          if (!newProductId) {
            throw new Error('Product creation failed - no ID returned');
          }

          setProductId(newProductId);

          const uploadedUrls = await uploadImagesToSupabase(newProductId, selectedFiles);
          finalImageUrls = uploadedUrls;

          if (uploadedUrls.length > 0) {
            console.log('🟢 9. Updating product with images...');
            await dispatch(updateProduct({
              id: newProductId,
              productData: { ...productData, images: uploadedUrls }
            })).unwrap();
          }

          setSaveSuccess(true);
          toast.success('Product created successfully! 🎉', { id: loadingToast });
          
          setTimeout(() => {
            navigate('/seller/products');
          }, 1500);

          setIsSubmitting(false);
          return;
        }
      } else {
        finalImageUrls = existingValidImages;
        console.log('🟢 10. No new images, using existing:', finalImageUrls.length);
      }

      // Prepare product data
      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : undefined,
        stock: parseInt(data.stock),
        brand: data.brand || undefined,
        color: data.color || undefined,
        material: data.material || undefined,
        tags: formData.tags,
        images: finalImageUrls,
        discount: data.discount ? parseFloat(data.discount) : 0,
        discountStartDate: data.discountStartDate || null,
        discountEndDate: data.discountEndDate || null,
        isPublished: formData.isPublished || false,
        isFeatured: formData.isFeatured || false,
        seller: user?._id,
      };

      console.log('🟢 11. Submitting product data:', productData);

      // Create or update product
      let result;
      if (isEditMode) {
        console.log('🟢 12a. Updating product with ID:', id);
        result = await dispatch(updateProduct({ id, productData })).unwrap();
        console.log('🟢 13a. Update result:', result);
        toast.success('Product updated successfully! 🎉', { id: loadingToast });
      } else {
        console.log('🟢 12b. Creating product...');
        result = await dispatch(createProduct(productData)).unwrap();
        console.log('🟢 13b. Create result:', result);
        toast.success('Product created successfully! 🎉', { id: loadingToast });
        
        if (result?.data?._id) {
          setProductId(result.data._id);
        }
      }

      setSaveSuccess(true);
      setSelectedFiles([]);

      setTimeout(() => {
        navigate('/seller/products');
      }, 1500);

    } catch (error) {
      console.error('🟢 14. ERROR:', error);
      console.error('🟢 15. Error details:', error.message);
      console.error('🟢 16. Error stack:', error.stack);
      toast.error(error.response?.data?.message || error.message || 'Failed to save product', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
      console.log('🟢 17. Done');
    }
  };

  // ============================================
  // ✅ FIXED FORM SUBMIT - Direct call without handleSubmit
  // ============================================

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('🔴 DIRECT FORM SUBMIT TRIGGERED!');
    
    // Get form values manually
    const form = e.target;
    const formDataObj = new FormData(form);
    
    const data = {
      name: formDataObj.get('name') || '',
      description: formDataObj.get('description') || '',
      price: parseFloat(formDataObj.get('price')) || 0,
      comparePrice: parseFloat(formDataObj.get('comparePrice')) || undefined,
      stock: parseInt(formDataObj.get('stock')) || 0,
      brand: formDataObj.get('brand') || '',
      color: formDataObj.get('color') || '',
      material: formDataObj.get('material') || '',
      discount: parseFloat(formDataObj.get('discount')) || 0,
      discountStartDate: formDataObj.get('discountStartDate') || '',
      discountEndDate: formDataObj.get('discountEndDate') || '',
    };
    
    console.log('🔴 Form data extracted:', data);
    
    // Call onSubmit directly
    onSubmit(data);
  };

  const handleCancel = () => {
    navigate('/seller/products');
  };

  // ============================================
  // RENDER
  // ============================================

  if (isLoading && isEditMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              {isEditMode ? 'Updated!' : 'Created!'}
            </span>
          )}
        </div>
      </div>

      {/* Image Upload Status */}
      {!isEditMode && selectedFiles.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400">
              ✅ {selectedFiles.length} image(s) ready to upload - Will be saved with product
            </span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* ✅ Form with direct submit handler */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          
          {/* BASIC INFORMATION */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                {...register('name')}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                {...register('description')}
                onChange={handleChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Describe your product..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* PRICING & STOCK */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-orange-500" />
              Pricing & Stock
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price * ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price', { valueAsNumber: true })}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all ${
                    errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Compare Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('comparePrice', { valueAsNumber: true })}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  {...register('stock', { valueAsNumber: true })}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all ${
                    errors.stock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* DISCOUNT SECTION */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Percent className="h-5 w-5 text-orange-500" />
                Product Discount
              </h2>
              <button
                type="button"
                onClick={toggleDiscountFields}
                className="text-sm text-navy-600 hover:text-orange-500 dark:text-navy-400 dark:hover:text-orange-400 transition-colors"
              >
                {showDiscountFields ? 'Hide Discount' : 'Add Discount'}
              </button>
            </div>

            {showDiscountFields && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={discountType === 'percentage' ? 100 : undefined}
                      {...register('discount', { valueAsNumber: true })}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all ${
                        errors.discount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 10.00'}
                    />
                    {errors.discount && (
                      <p className="mt-1 text-sm text-red-600">{errors.discount.message}</p>
                    )}
                  </div>
                </div>

                {priceValue && discountValue && discountValue > 0 && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Original Price: <span className="font-medium text-gray-900 dark:text-white">${parseFloat(priceValue).toFixed(2)}</span>
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Discounted Price: <span className="font-bold">${calculateDiscountedPrice() || '0.00'}</span>
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        {discountType === 'percentage' ? `${discountValue}% OFF` : `-$${parseFloat(discountValue).toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      {...register('discountStartDate')}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      {...register('discountEndDate')}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                </div>

                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Discount will be automatically applied to this product when active.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* IMAGES */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Image className="h-5 w-5 text-orange-500" />
              Product Images
            </h2>

            <ProductImageUpload
              productId={productId}
              existingImages={formData.images || []}
              onUploadSuccess={handleImageUpload}
              onFileSelect={handleFileSelect}
              isCreatingNew={!isEditMode}
            />
            
            {formData.images && formData.images.length > 0 && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                ✅ {formData.images.length} image(s) uploaded
                {!isEditMode && ' - Will be saved with product'}
              </p>
            )}
          </div>

          {/* ATTRIBUTES */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Box className="h-5 w-5 text-orange-500" />
              Attributes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  {...register('brand')}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color (Optional)
                </label>
                <input
                  type="text"
                  {...register('color')}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Enter color"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Material (Optional)
                </label>
                <input
                  type="text"
                  {...register('material')}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Enter material"
                />
              </div>
            </div>
          </div>

          {/* TAGS */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <List className="h-5 w-5 text-orange-500" />
              Tags
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (Press Enter to add)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Type a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={handleTagAdd}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PUBLISH STATUS */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-orange-500" />
              Product Status
            </h2>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished || false}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, isPublished: e.target.checked }));
                  }}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Published
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (Product will appear on shop page)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured || false}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, isFeatured: e.target.checked }));
                  }}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Featured
                </span>
              </label>
            </div>

            {!formData.isPublished && (
              <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                ⚠️ This product is not published and will not appear on the shop page.
              </p>
            )}
          </div>
        </div>

        {/* FORM ACTIONS */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={(e) => {
              console.log('🔵 UPDATE BUTTON CLICKED!');
              console.log('🔵 isSubmitting:', isSubmitting);
              console.log('🔵 isLoading:', isLoading);
              console.log('🔵 isEditMode:', isEditMode);
              // Don't prevent default - let the form handle it
            }}
            disabled={isSubmitting || isLoading}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditMode ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerProductForm;