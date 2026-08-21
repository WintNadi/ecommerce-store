import nodemailer from 'nodemailer';
import { emailTemplates } from './emailTemplates.js';

/**
 * Email Service - Handles all email sending
 * Using Nodemailer with SMTP support
 */

// ============================================
// TRANSPORTER CONFIGURATION
// ============================================

let transporter = null;

/**
 * Create and return email transporter
 * Singleton pattern to reuse connection
 */
const getTransporter = () => {
  if (transporter) return transporter;

  // Check if SMTP is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email not configured. Please set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    pool: true, // Use connection pooling
    maxConnections: 5,
    rateLimit: 10, // Max emails per second
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  // Verify connection
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email transporter error:', error);
    } else {
      console.log('✅ Email transporter ready');
    }
  });

  return transporter;
};

// ============================================
// MAIN SEND FUNCTION
// ============================================

/**
 * Send email with HTML content
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text fallback (optional)
 * @returns {Promise} - Nodemailer send result
 */
export const sendEmail = async (options) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('📧 Email not sent - transporter not configured');
      return null;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"${process.env.STORE_NAME || 'Shop Store'}" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for plain text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${options.email} - ${options.subject}`);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    // Don't throw - just log and return null
    return null;
  }
};

// ============================================
// ORDER EMAILS
// ============================================

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = async (order) => {
  const html = emailTemplates.orderConfirmation(order);
  return await sendEmail({
    email: order.user.email,
    subject: `Order Confirmation #${order.orderNumber}`,
    html
  });
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdate = async (order, oldStatus, newStatus) => {
  const html = emailTemplates.orderStatusUpdate(order, oldStatus, newStatus);
  return await sendEmail({
    email: order.user.email,
    subject: `Order #${order.orderNumber} - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    html
  });
};

/**
 * Send order shipped email with tracking
 */
export const sendOrderShipped = async (order) => {
  const html = emailTemplates.orderShipped(order);
  return await sendEmail({
    email: order.user.email,
    subject: `Order #${order.orderNumber} - Shipped! 🚚`,
    html
  });
};

/**
 * Send order delivered email
 */
export const sendOrderDelivered = async (order) => {
  const html = emailTemplates.orderDelivered(order);
  return await sendEmail({
    email: order.user.email,
    subject: `Order #${order.orderNumber} - Delivered ✅`,
    html
  });
};

// ============================================
// REFUND EMAILS
// ============================================

/**
 * Send refund request confirmation
 */
export const sendRefundRequestConfirmation = async (refund) => {
  const html = emailTemplates.refundRequestConfirmation(refund);
  return await sendEmail({
    email: refund.user.email,
    subject: `Refund Request #${refund._id.slice(-6)} - Received`,
    html
  });
};

/**
 * Send refund approval email
 */
export const sendRefundApproved = async (refund) => {
  const html = emailTemplates.refundApproved(refund);
  return await sendEmail({
    email: refund.user.email,
    subject: `Refund #${refund._id.slice(-6)} - Approved ✅`,
    html
  });
};

/**
 * Send refund rejection email
 */
export const sendRefundRejected = async (refund) => {
  const html = emailTemplates.refundRejected(refund);
  return await sendEmail({
    email: refund.user.email,
    subject: `Refund #${refund._id.slice(-6)} - Update`,
    html
  });
};

// ============================================
// REVIEW EMAILS
// ============================================

/**
 * Send review approval confirmation
 */
export const sendReviewApproved = async (review) => {
  const html = emailTemplates.reviewApproved(review);
  return await sendEmail({
    email: review.user.email,
    subject: 'Your Review Has Been Approved ✅',
    html
  });
};

/**
 * Send review rejection email
 */
export const sendReviewRejected = async (review, reason) => {
  const html = emailTemplates.reviewRejected(review, reason);
  return await sendEmail({
    email: review.user.email,
    subject: 'Your Review Update',
    html
  });
};

/**
 * Send admin response to review
 */
export const sendAdminResponseToReview = async (review) => {
  const html = emailTemplates.adminResponseToReview(review);
  return await sendEmail({
    email: review.user.email,
    subject: `Admin Response to Your Review`,
    html
  });
};

// ============================================
// AUTHENTICATION EMAILS
// ============================================

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (user) => {
  const html = emailTemplates.welcomeEmail(user);
  return await sendEmail({
    email: user.email,
    subject: `Welcome to ${process.env.STORE_NAME || 'Shop Store'}! 🎉`,
    html
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const html = emailTemplates.passwordResetEmail(user, resetUrl);
  return await sendEmail({
    email: user.email,
    subject: 'Password Reset Request',
    html
  });
};

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (user, verifyToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  const html = emailTemplates.verificationEmail(user, verifyUrl);
  return await sendEmail({
    email: user.email,
    subject: 'Verify Your Email Address',
    html
  });
};

// ============================================
// SELLER EMAILS
// ============================================

/**
 * Send seller registration confirmation
 */
export const sendSellerRegistrationConfirmation = async (user) => {
  const html = emailTemplates.sellerRegistrationConfirmation(user);
  return await sendEmail({
    email: user.email,
    subject: `Seller Registration Confirmed - ${user.sellerProfile.storeName}`,
    html
  });
};

/**
 * Send seller approval email
 */
export const sendSellerApproved = async (user) => {
  const html = emailTemplates.sellerApproved(user);
  return await sendEmail({
    email: user.email,
    subject: `Your Seller Account Has Been Approved ✅`,
    html
  });
};

/**
 * Send new order notification to seller
 */
export const sendNewOrderToSeller = async (order, seller) => {
  const html = emailTemplates.newOrderToSeller(order, seller);
  return await sendEmail({
    email: seller.email,
    subject: `New Order Received - #${order.orderNumber} 🛒`,
    html
  });
};

// ============================================
// ADMIN EMAILS
// ============================================

/**
 * Send new refund request notification to admin
 */
export const sendNewRefundToAdmin = async (refund) => {
  const html = emailTemplates.newRefundToAdmin(refund);
  return await sendEmail({
    email: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Refund Request - #${refund._id.slice(-6)}`,
    html
  });
};

/**
 * Send new review notification to admin
 */
export const sendNewReviewToAdmin = async (review) => {
  const html = emailTemplates.newReviewToAdmin(review);
  return await sendEmail({
    email: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Review - ${review.product.name}`,
    html
  });
};

// ============================================
// EXPORT
// ============================================

export default {
  sendEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderShipped,
  sendOrderDelivered,
  sendRefundRequestConfirmation,
  sendRefundApproved,
  sendRefundRejected,
  sendReviewApproved,
  sendReviewRejected,
  sendAdminResponseToReview,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendSellerRegistrationConfirmation,
  sendSellerApproved,
  sendNewOrderToSeller,
  sendNewRefundToAdmin,
  sendNewReviewToAdmin
};