import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
  getPaymentStatus,
  refundPayment
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Webhook (Public - Stripe calls this)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Protected Routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm-payment', protect, confirmPayment);
router.get('/status/:orderId', protect, getPaymentStatus);

// Admin Routes
router.post('/refund/:orderId', protect, authorize('admin'), refundPayment);

export default router;