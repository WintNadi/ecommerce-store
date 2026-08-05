import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ADMIN ROUTES
// ============================================

// Get admin stats
router.get('/stats', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Admin stats endpoint - to be implemented'
    }
  });
});

// User management routes
router.get('/users', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Get all users - to be implemented'
    }
  });
});

router.put('/users/:id/role', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Update user role - to be implemented'
    }
  });
});

router.delete('/users/:id', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Delete user - to be implemented'
    }
  });
});

export default router;