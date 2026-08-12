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
} from '../store/slices/productSlice';
import ProductImageUpload from '../components/products/ProductImageUpload';
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
  CheckCircle
} from 'lucide-react';

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
  tags: z.array(z.string()).optional(),
});

const ProductForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { user } = useSelector((state) => state.auth);
  const { selectedProduct, isLoading, error } = useSelector((state) => state.products);

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
    isPublished: false,
    isFeatured: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [productId, setProductId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
    reset,
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
    },
  });

  // ============================================
  // LOAD PRODUCT DATA (Edit Mode)
  // ============================================

  useEffect(() => {
    if (isEditMode && id) {
      console.log('🔍 Fetching product:', id);
      dispatch(getProductById(id));
    } else {
      dispatch(clearProduct());
      reset();
    }
  }, [dispatch, id, isEditMode, reset]);

  useEffect(() => {
    if (selectedProduct && isEditMode) {
      console.log('📦 Product loaded:', selectedProduct);
      
      const product = selectedProduct;
      
      // ✅ Set formData
      setFormData({
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
        isPublished: product.isPublished || false,
        isFeatured: product.isFeatured || false,
      });

      setProductId(product._id);

      // ✅ Set react-hook-form values
      const fields = ['name', 'description', 'price', 'comparePrice', 'stock', 'brand', 'color', 'material'];
      fields.forEach((field) => {
        setValue(field, product[field] || '');
      });

      if (product.tags) {
        setFormData((prev) => ({ ...prev, tags: product.tags }));
      }
    }
  }, [selectedProduct, isEditMode, setValue]);

  // ... (rest of the component - handlers, submit, render)

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

  // ============================================
  // SUBMIT
  // ============================================

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSaveSuccess(false);

    try {
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
        images: formData.images,
        isPublished: formData.isPublished || false,
        isFeatured: formData.isFeatured || false,
        seller: user?._id,
      };

      let result;
      if (isEditMode) {
        result = await dispatch(updateProduct({ id, productData })).unwrap();
      } else {
        result = await dispatch(createProduct(productData)).unwrap();
        
        if (result?.data?._id) {
          setProductId(result.data._id);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/seller/products');
      }, 1500);

    } catch (error) {
      console.error('❌ Error saving product:', error);
      alert(error.response?.data?.message || error.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          
          {/* BASIC INFORMATION */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
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
              <DollarSign className="h-5 w-5 text-indigo-600" />
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
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

          {/* ✅ IMAGES */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Image className="h-5 w-5 text-indigo-600" />
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
              <Box className="h-5 w-5 text-indigo-600" />
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter material"
                />
              </div>
            </div>
          </div>

          {/* TAGS */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <List className="h-5 w-5 text-indigo-600" />
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
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Type a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={handleTagAdd}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-sm rounded-full"
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

          {/* ✅ PUBLISH STATUS */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-indigo-600" />
              Product Status
            </h2>

            <div className="flex flex-wrap items-center gap-6">
              {/* Published Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished || false}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, isPublished: e.target.checked }));
                  }}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Published
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (Product will appear on shop page)
                </span>
              </label>

              {/* Featured Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured || false}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, isFeatured: e.target.checked }));
                  }}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
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
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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

export default ProductForm;