import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all categories
router.get('/', async (req, res) => {
  try {
    const Category = (await import('../models/Category.js')).default;
    const categories = await Category.find({ isActive: true });
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const Category = (await import('../models/Category.js')).default;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Create category (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const Category = (await import('../models/Category.js')).default;
    const category = await Category.create(req.body);
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update category (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const Category = (await import('../models/Category.js')).default;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete category (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const Category = (await import('../models/Category.js')).default;
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;