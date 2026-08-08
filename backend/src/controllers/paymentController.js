import stripe from '../config/stripe.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// CREATE PAYMENT INTENT
// ============================================

/**
 * @desc    Create a payment intent for Stripe
 * @route   POST /api/payments/create-payment-intent
 * @access  Private
 */
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  console.log('📝 Creating payment intent for order:', orderId);

  // Find the order
  const order = await Order.findById(orderId);

  if (!order) {
    console.error('❌ Order not found:', orderId);
    throw new AppError('Order not found', 404);
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    console.error('❌ Unauthorized user:', req.user._id);
    throw new AppError('You are not authorized to pay for this order', 403);
  }

  // Check if order is already paid
  if (order.paymentStatus === 'paid') {
    console.error('❌ Order already paid:', orderId);
    throw new AppError('Order is already paid', 400);
  }

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        orderNumber: order.orderNumber
      },
      receipt_email: req.user.email,
      description: `Order #${order.orderNumber}`,
      shipping: {
        name: req.user.name,
        address: {
          line1: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postal_code: order.shippingAddress.zipCode,
          country: order.shippingAddress.country
        }
      }
    });

    console.log('✅ Payment intent created:', paymentIntent.id);
    console.log('💰 Amount:', paymentIntent.amount / 100, 'USD');

    // Update order with payment intent ID
    order.paymentResult = {
      id: paymentIntent.id,
      status: paymentIntent.status,
      paymentIntent: paymentIntent.client_secret
    };
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      }
    });
  } catch (error) {
    console.error('❌ Stripe error:', error);
    throw new AppError(`Payment initialization failed: ${error.message}`, 500);
  }
});

// ============================================
// CONFIRM PAYMENT
// ============================================

/**
 * @desc    Confirm payment after successful charge
 * @route   POST /api/payments/confirm-payment
 * @access  Private
 */
export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  console.log('📝 Confirming payment for order:', orderId);
  console.log('📝 Payment Intent ID:', paymentIntentId);

  // Find the order
  const order = await Order.findById(orderId);

  if (!order) {
    console.error('❌ Order not found:', orderId);
    throw new AppError('Order not found', 404);
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    console.error('❌ Unauthorized user:', req.user._id);
    throw new AppError('You are not authorized to confirm this payment', 403);
  }

  // Retrieve payment intent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  console.log('✅ Payment Intent Status:', paymentIntent.status);

  if (paymentIntent.status === 'succeeded') {
    // Update order payment status
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    order.paymentResult = {
      id: paymentIntent.id,
      status: paymentIntent.status,
      updateTime: new Date().toISOString(),
      emailAddress: req.user.email,
      paymentIntent: paymentIntent.client_secret
    };

    // Update order status
    order.status = 'processing';
    order.timeline.push({
      status: 'processing',
      note: 'Payment confirmed. Order is being processed.',
      date: new Date()
    });

    await order.save();

    console.log('✅ Order updated successfully:', order.orderNumber);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user._id}`).emit('payment_success', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      });
      console.log('📡 Payment success event emitted');
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: order
    });
  } else {
    console.error('❌ Payment not successful. Status:', paymentIntent.status);
    throw new AppError(`Payment not successful. Status: ${paymentIntent.status}`, 400);
  }
});

// ============================================
// STRIPE WEBHOOK (Optional - Not used currently)
// ============================================

/**
 * @desc    Handle Stripe webhook events
 * @route   POST /api/payments/webhook
 * @access  Public (Stripe calls this)
 */
export const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Stripe Webhook Event: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        
        if (orderId) {
          const order = await Order.findById(orderId);
          if (order && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.paidAt = new Date();
            order.paymentResult = {
              id: paymentIntent.id,
              status: paymentIntent.status,
              updateTime: paymentIntent.created,
              emailAddress: paymentIntent.receipt_email,
              paymentIntent: paymentIntent.client_secret
            };
            order.status = 'processing';
            order.timeline.push({
              status: 'processing',
              note: 'Payment confirmed via webhook. Order is being processed.',
              date: new Date()
            });
            await order.save();
            console.log('✅ Order updated via webhook:', order.orderNumber);

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
              io.to(`user_${order.user}`).emit('payment_success', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status
              });
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        
        if (orderId) {
          const order = await Order.findById(orderId);
          if (order) {
            order.paymentStatus = 'failed';
            order.paymentResult = {
              id: paymentIntent.id,
              status: paymentIntent.status,
              updateTime: paymentIntent.created,
              paymentIntent: paymentIntent.client_secret
            };
            await order.save();
            console.log('❌ Payment failed for order:', order.orderNumber);
          }
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        
        if (orderId) {
          const order = await Order.findById(orderId);
          if (order && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'cancelled';
            order.paymentResult = {
              id: paymentIntent.id,
              status: paymentIntent.status,
              updateTime: paymentIntent.created,
              paymentIntent: paymentIntent.client_secret
            };
            await order.save();
            console.log('⚠️ Payment cancelled for order:', order.orderNumber);
          }
        }
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// ============================================
// GET PAYMENT STATUS
// ============================================

/**
 * @desc    Get payment status for an order
 * @route   GET /api/payments/status/:orderId
 * @access  Private
 */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to view this payment', 403);
  }

  res.status(200).json({
    success: true,
    data: {
      paymentStatus: order.paymentStatus,
      paidAt: order.paidAt,
      paymentMethod: order.paymentMethod,
      totalPrice: order.totalPrice
    }
  });
});

// ============================================
// REFUND PAYMENT
// ============================================

/**
 * @desc    Refund a payment (Admin only)
 * @route   POST /api/payments/refund/:orderId
 * @access  Private (Admin)
 */
export const refundPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.paymentStatus !== 'paid') {
    throw new AppError('Only paid orders can be refunded', 400);
  }

  if (order.paymentResult?.id) {
    try {
      // Create refund
      const refund = await stripe.refunds.create({
        payment_intent: order.paymentResult.id,
        reason: reason || 'requested_by_customer'
      });

      // Update order
      order.paymentStatus = 'refunded';
      order.refundAmount = order.totalPrice;
      order.refundReason = reason || 'Refund requested';
      order.refundedAt = new Date();
      order.status = 'refunded';
      order.timeline.push({
        status: 'refunded',
        note: `Payment refunded: ${reason || 'Requested by customer'}`,
        date: new Date()
      });

      await order.save();

      console.log('✅ Refund processed for order:', order.orderNumber);

      res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: {
          refundId: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        }
      });
    } catch (error) {
      console.error('❌ Refund error:', error);
      throw new AppError(`Refund failed: ${error.message}`, 400);
    }
  } else {
    throw new AppError('No payment found to refund', 404);
  }
});