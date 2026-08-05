import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// CREATE PRODUCT
// ============================================

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Admin/Seller)
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    price,
    comparePrice,
    costPrice,
    stock,
    category,
    subCategory,
    tags,
    images,
    thumbnail,
    attributes,
    variations,
    hasVariations,
    seo,
    shipping,
    discount,
    discountStartDate,
    discountEndDate,
    isFeatured,
    isPublished
  } = req.body;

  // ✅ Check if category exists (if provided)
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new AppError('Category not found', 404);
    }
  }

  // Check if sub-category exists (if provided)
  if (subCategory) {
    const subCategoryExists = await Category.findById(subCategory);
    if (!subCategoryExists) {
      throw new AppError('Sub-category not found', 404);
    }
  }

  // Create product
  const product = await Product.create({
    name,
    description,
    shortDescription,
    price,
    comparePrice,
    costPrice,
    stock,
    category: category || null,
    subCategory: subCategory || null,
    tags: tags || [],
    images: images || [],
    thumbnail: thumbnail || '',
    attributes: attributes || {},
    variations: variations || [],
    hasVariations: hasVariations || false,
    seo: seo || {},
    shipping: shipping || {},
    discount: discount || 0,
    discountStartDate: discountStartDate || null,
    discountEndDate: discountEndDate || null,
    isFeatured: isFeatured || false,
    isPublished: isPublished || false,
    seller: req.user._id,
    isActive: true
  });

  // Increment category product count (if category exists)
  if (category) {
    const categoryExists = await Category.findById(category);
    if (categoryExists) {
      await categoryExists.incrementProductCount();
    }
  }

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

// ============================================
// GET ALL PRODUCTS
// ============================================

/**
 * @desc    Get all products with filtering, sorting, pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    category,
    subCategory,
    minPrice,
    maxPrice,
    rating,
    brand,
    tags,
    search,
    isFeatured,
    isPublished = true,
    inStock
  } = req.query;

  // Build filter
  const filter = {};

  // Only show published products for public
  if (isPublished !== undefined) {
    filter.isPublished = isPublished === 'true';
  }

  // Category filter (only if provided)
  if (category) {
    filter.category = category;
  }

  if (subCategory) {
    filter.subCategory = subCategory;
  }

  // Price filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Rating filter
  if (rating) {
    filter.rating = { $gte: Number(rating) };
  }

  // Brand filter
  if (brand) {
    filter['attributes.brand'] = brand;
  }

  // Tags filter
  if (tags) {
    filter.tags = { $in: tags.split(',') };
  }

  // In stock filter
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  // Featured filter
  if (isFeatured === 'true') {
    filter.isFeatured = true;
  }

  // Search filter
  let searchQuery = {};
  if (search) {
    searchQuery = {
      $text: { $search: search }
    };
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort
  let sortQuery = {};
  if (sort.startsWith('-')) {
    sortQuery[sort.substring(1)] = -1;
  } else {
    sortQuery[sort] = 1;
  }

  // Execute query
  const query = Product.find({ ...filter, ...searchQuery })
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug');

  // If search, add text score
  if (search) {
    query.select({ score: { $meta: 'textScore' } });
    query.sort({ score: { $meta: 'textScore' }, ...sortQuery });
  }

  const products = await query;
  const total = await Product.countDocuments({ ...filter, ...searchQuery });

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// GET SINGLE PRODUCT
// ============================================

/**
 * @desc    Get single product by ID or slug
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if id is slug or ObjectId
  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

  let product;
  if (isObjectId) {
    product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('reviews.user', 'name profileImage');
  } else {
    product = await Product.findOne({ slug: id })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('reviews.user', 'name profileImage');
  }

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Increment views
  product.views += 1;
  await product.save({ validateBeforeSave: false });

  // Get related products
  const relatedProducts = await product.getRelatedProducts(5);

  res.status(200).json({
    success: true,
    data: product,
    related: relatedProducts
  });
});

// ============================================
// UPDATE PRODUCT
// ============================================

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Admin/Seller)
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user is seller of this product or admin
  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to update this product', 403);
  }

  // Update fields
  const allowedFields = [
    'name',
    'description',
    'shortDescription',
    'price',
    'comparePrice',
    'costPrice',
    'stock',
    'category',
    'subCategory',
    'tags',
    'images',
    'thumbnail',
    'attributes',
    'variations',
    'hasVariations',
    'seo',
    'shipping',
    'discount',
    'discountStartDate',
    'discountEndDate',
    'isFeatured',
    'isPublished',
    'isActive'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product
  });
});

// ============================================
// DELETE PRODUCT
// ============================================

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin/Seller)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user is seller of this product or admin
  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to delete this product', 403);
  }

  // Decrement category product count
  if (product.category) {
    const category = await Category.findById(product.category);
    if (category) {
      await category.decrementProductCount();
    }
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// ============================================
// ADD PRODUCT REVIEW
// ============================================

/**
 * @desc    Add product review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const addProductReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment, title } = req.body;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    review => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    throw new AppError('You have already reviewed this product', 400);
  }

  // Add review
  product.reviews.push({
    user: req.user._id,
    rating: Number(rating),
    title,
    comment,
    createdAt: new Date()
  });

  // Update product rating
  product.calculateRating();
  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: product.reviews
  });
});

// ============================================
// GET PRODUCT REVIEWS
// ============================================

/**
 * @desc    Get product reviews
 * @route   GET /api/products/:id/reviews
 * @access  Public
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = product.reviews
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(skip, skip + parseInt(limit));

  const total = product.reviews.length;

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// UPDATE PRODUCT STOCK
// ============================================

/**
 * @desc    Update product stock
 * @route   PATCH /api/products/:id/stock
 * @access  Private (Admin/Seller)
 */
export const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user is seller of this product or admin
  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to update this product', 403);
  }

  product.stock = stock;
  product.isInStock = stock > 0;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: { stock: product.stock, isInStock: product.isInStock }
  });
});

// ============================================
// BULK PRODUCT OPERATIONS
// ============================================

/**
 * @desc    Bulk create products
 * @route   POST /api/products/bulk
 * @access  Private (Admin only)
 */
export const bulkCreateProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    throw new AppError('Please provide an array of products', 400);
  }

  // Add seller to each product
  const productsWithSeller = products.map(product => ({
    ...product,
    seller: req.user._id,
    isActive: true
  }));

  const createdProducts = await Product.insertMany(productsWithSeller);

  // Increment category counts
  for (const product of createdProducts) {
    if (product.category) {
      const category = await Category.findById(product.category);
      if (category) {
        await category.incrementProductCount();
      }
    }
  }

  res.status(201).json({
    success: true,
    message: `${createdProducts.length} products created successfully`,
    data: createdProducts
  });
});

// ============================================
// GET PRODUCT STATISTICS
// ============================================

/**
 * @desc    Get product statistics
 * @route   GET /api/products/stats
 * @access  Private (Admin/Seller)
 */
export const getProductStats = asyncHandler(async (req, res) => {
  const stats = await Product.getStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

// ============================================
// GET FEATURED PRODUCTS
// ============================================

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.getFeatured(parseInt(limit));

  res.status(200).json({
    success: true,
    data: products
  });
});

// ============================================
// GET TOP SELLING PRODUCTS
// ============================================

/**
 * @desc    Get top selling products
 * @route   GET /api/products/top-selling
 * @access  Public
 */
export const getTopSellingProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.getTopSelling(parseInt(limit));

  res.status(200).json({
    success: true,
    data: products
  });
});

// ============================================
// SEARCH PRODUCTS
// ============================================

/**
 * @desc    Search products
 * @route   GET /api/products/search
 * @access  Public
 */
export const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20, sort = '-createdAt' } = req.query;

  if (!q || q.length < 2) {
    throw new AppError('Please provide a search term (minimum 2 characters)', 400);
  }

  const products = await Product.searchProducts(q, {
    limit: parseInt(limit),
    page: parseInt(page),
    sort
  });

  const total = await Product.countDocuments({
    $text: { $search: q },
    isPublished: true,
    isActive: true
  });

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});