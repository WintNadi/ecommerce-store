import Product from '../models/Product.js';
import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// UPLOAD SINGLE IMAGE
// ============================================

/**
 * @desc    Upload a single image for a product
 * @route   POST /api/products/:id/upload-image
 * @access  Private (Admin/Seller)
 */
export const uploadProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check authorization
    if (req.user.role === 'seller' && product.seller?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload images for this product'
      });
    }

    // Check Supabase credentials
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials missing!');
      return res.status(500).json({
        success: false,
        message: 'Supabase is not configured. Please check your environment variables.'
      });
    }

    // Upload to Supabase
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${id}/${fileName}`;

    console.log(`📤 Uploading file: ${file.originalname} to ${filePath}`);

    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to storage',
        error: error.message
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    console.log('✅ Image uploaded successfully:', urlData.publicUrl);

    // Update product with new image
    const existingImages = product.images || [];
    product.images = [...existingImages, urlData.publicUrl];
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: urlData.publicUrl,
        allImages: product.images
      }
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
};

// ============================================
// UPLOAD MULTIPLE IMAGES (MAIN FUNCTION)
// ============================================

/**
 * @desc    Upload multiple images for a product
 * @route   POST /api/products/:id/upload-images
 * @access  Private (Admin/Seller)
 */
export const uploadMultipleProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    console.log('📸 Upload request received:');
    console.log('  - Product ID:', id);
    console.log('  - Files count:', files?.length || 0);
    console.log('  - User:', req.user?.email);

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check authorization
    if (req.user.role === 'seller' && product.seller?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload images for this product'
      });
    }

    // Check Supabase credentials
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials missing!');
      return res.status(500).json({
        success: false,
        message: 'Supabase is not configured. Please check your environment variables.'
      });
    }

    const uploadedUrls = [];
    const errors = [];

    for (const file of files) {
      try {
        console.log(`📤 Uploading file: ${file.originalname} (${file.size} bytes)`);

        // Generate unique filename
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file.buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.mimetype
          });

        if (error) {
          console.error('❌ Supabase upload error for file:', file.originalname, error);
          errors.push({ 
            filename: file.originalname, 
            error: error.message 
          });
          continue;
        }

        console.log(`✅ File uploaded: ${fileName}`);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);

      } catch (err) {
        console.error('❌ Error uploading file:', file.originalname, err);
        errors.push({ 
          filename: file.originalname, 
          error: err.message 
        });
      }
    }

    console.log(`📊 Upload summary: ${uploadedUrls.length} success, ${errors.length} failed`);

    // Update product with new image URLs
    const existingImages = product.images || [];
    const allImages = [...existingImages, ...uploadedUrls];
    product.images = allImages;
    await product.save({ validateBeforeSave: false });

    // If all files failed, return error
    if (uploadedUrls.length === 0 && errors.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'All images failed to upload',
        errors: errors
      });
    }

    res.status(200).json({
      success: true,
      message: `${uploadedUrls.length} images uploaded successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        imageUrls: uploadedUrls,
        allImages: allImages,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Multiple image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
};

// ============================================
// DELETE IMAGE
// ============================================

/**
 * @desc    Delete an image from a product
 * @route   DELETE /api/products/:id/images/:imageIndex
 * @access  Private (Admin/Seller)
 */
export const deleteProductImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check authorization
    if (req.user.role === 'seller' && product.seller?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete images for this product'
      });
    }

    const images = product.images || [];
    if (index < 0 || index >= images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    // Remove image from array
    images.splice(index, 1);
    product.images = images;
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        remainingImages: product.images
      }
    });

  } catch (error) {
    console.error('❌ Delete image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image'
    });
  }
};

// ============================================
// DELETE ALL IMAGES
// ============================================

/**
 * @desc    Delete all images from a product
 * @route   DELETE /api/products/:id/images
 * @access  Private (Admin/Seller)
 */
export const deleteAllProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (req.user.role === 'seller' && product.seller?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete images for this product'
      });
    }

    product.images = [];
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'All images deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete all images error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete images'
    });
  }
};

// ============================================
// GET PRODUCT IMAGES
// ============================================

/**
 * @desc    Get all images for a product
 * @route   GET /api/products/:id/images
 * @access  Private (Admin/Seller)
 */
export const getProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        images: product.images || [],
        count: (product.images || []).length
      }
    });

  } catch (error) {
    console.error('❌ Get images error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get images'
    });
  }
};

// ============================================
// SET PRIMARY IMAGE
// ============================================

/**
 * @desc    Set a primary image for a product
 * @route   PUT /api/products/:id/images/:imageIndex/primary
 * @access  Private (Admin/Seller)
 */
export const setPrimaryImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (req.user.role === 'seller' && product.seller?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update images for this product'
      });
    }

    const images = product.images || [];
    if (index < 0 || index >= images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    // Move the selected image to the front
    const selectedImage = images.splice(index, 1)[0];
    images.unshift(selectedImage);
    product.images = images;
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Primary image set successfully',
      data: {
        primaryImage: product.images[0],
        allImages: product.images
      }
    });

  } catch (error) {
    console.error('❌ Set primary image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to set primary image'
    });
  }
};

// ============================================
// REORDER IMAGES
// ============================================

/**
 * @desc    Reorder images for a product
 * @route   PUT /api/products/:id/images/reorder
 * @access  Private (Admin/Seller)
 */
export const reorderImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageOrder } = req.body;

    if (!imageOrder || !Array.isArray(imageOrder) || imageOrder.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid image order array'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (req.user.role === 'seller' && product.seller?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reorder images for this product'
      });
    }

    const currentImages = product.images || [];
    const allImageIndexes = imageOrder.every(index => index >= 0 && index < currentImages.length);

    if (!allImageIndexes || imageOrder.length !== currentImages.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image order - all images must be included'
      });
    }

    const reorderedImages = imageOrder.map(index => currentImages[index]);
    product.images = reorderedImages;
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Images reordered successfully',
      data: {
        images: product.images
      }
    });

  } catch (error) {
    console.error('❌ Reorder images error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reorder images'
    });
  }
};