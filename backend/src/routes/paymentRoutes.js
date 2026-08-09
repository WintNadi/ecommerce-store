import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
  getPaymentStatus,
  refundPayment,
  createPaymentIntentWithoutOrder,
  createOrderAfterPayment // ← NEW: Import the new function
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// WEBHOOK - Public (Stripe calls this)
// ============================================================
// ⚠️ Must use express.raw() for Stripe webhook signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// ============================================================
// PROTECTED PAYMENT ROUTES
// ============================================================

// 1️⃣ Create payment intent WITH order (Original)
// Creates order first, then payment intent
// Used for COD flow or when order needs to exist before payment
router.post('/create-payment-intent', protect, createPaymentIntent);

// 2️⃣ Create payment intent WITHOUT order (New)
// Creates payment intent ONLY - NO order created
// Order is created AFTER successful payment
// Prevents unpaid orders in database
router.post('/create-payment-intent-without-order', protect, createPaymentIntentWithoutOrder);

// 3️⃣ Create order after successful payment (New)
// Called from frontend after Stripe payment succeeds
// Creates the order with payment details
router.post('/create-order-after-payment', protect, createOrderAfterPayment);

// 4️⃣ Confirm payment (for manual confirmation)
router.post('/confirm-payment', protect, confirmPayment);

// 5️⃣ Get payment status for an order
router.get('/status/:orderId', protect, getPaymentStatus);

// ============================================================
// ADMIN ROUTES
// ============================================================
router.post('/refund/:orderId', protect, authorize('admin'), refundPayment);

// ============================================================
// TEST ROUTE (Optional - for debugging)
// ============================================================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Payment routes are working!',
    endpoints: [
      'POST /api/payments/webhook',
      'POST /api/payments/create-payment-intent',
      'POST /api/payments/create-payment-intent-without-order',
      'POST /api/payments/create-order-after-payment',
      'POST /api/payments/confirm-payment',
      'GET /api/payments/status/:orderId',
      'POST /api/payments/refund/:orderId'
    ]
  });
});

export default router;