/**
 * Email Templates - HTML templates for all email types
 * All templates are responsive and support dark mode
 */

// ============================================
// BASE TEMPLATE
// ============================================

const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* Reset & Base */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f6f9fc;
      color: #333;
      line-height: 1.6;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #1A2B4C, #2C4A7C);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header .subtitle {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      margin-top: 4px;
    }
    .content {
      padding: 32px 24px;
    }
    .content h2 {
      color: #1A2B4C;
      font-size: 20px;
      margin-bottom: 16px;
    }
    .content p {
      color: #555;
      margin-bottom: 12px;
      font-size: 15px;
    }
    .button {
      display: inline-block;
      padding: 12px 32px;
      background: #E86A33;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
      transition: background 0.3s;
    }
    .button:hover { background: #d45a26; }
    .button-secondary {
      background: #1A2B4C;
    }
    .button-secondary:hover { background: #2C4A7C; }
    .info-box {
      background: #f0f4f8;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
      border-left: 4px solid #E86A33;
    }
    .info-box p { margin: 0; font-size: 14px; }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .table th {
      background: #f0f4f8;
      text-align: left;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #1A2B4C;
    }
    .table td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
      color: #555;
    }
    .table .total {
      font-weight: 700;
      font-size: 16px;
      color: #1A2B4C;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .status-pending { background: #fef3c7; color: #b45309; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-completed { background: #dbeafe; color: #1e40af; }
    .status-shipped { background: #e0e7ff; color: #3730a3; }
    .status-delivered { background: #d1fae5; color: #065f46; }
    .footer {
      background: #f8fafc;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #94a3b8;
      font-size: 13px;
      margin: 4px 0;
    }
    .footer a {
      color: #1A2B4C;
      text-decoration: none;
    }
    .footer a:hover { text-decoration: underline; }
    .divider { 
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }
    @media (max-width: 480px) {
      .content { padding: 20px 16px; }
      .header { padding: 24px 16px; }
      .header h1 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>${process.env.STORE_NAME || 'Shop Store'}</h1>
      <div class="subtitle">${title}</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      ${content}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${process.env.STORE_NAME || 'Shop Store'}. All rights reserved.</p>
      <p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">Visit Store</a>
        &nbsp;·&nbsp;
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/contact">Contact</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// ORDER TEMPLATES
// ============================================

/**
 * Order Confirmation Email
 */
export const orderConfirmation = (order) => {
  const orderItems = order.orderItems.map(item => `
    <tr>
      <td>${item.name} × ${item.quantity}</td>
      <td style="text-align:right">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
    <h2>Thank you for your order! 🎉</h2>
    <p>Hi ${order.user.name},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has been confirmed and is being processed.</p>
    
    <div class="info-box">
      <p><strong>Order Summary</strong></p>
      <p>Order #: ${order.orderNumber}</p>
      <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
      <p>Status: <span class="status-badge status-pending">Pending</span></p>
    </div>
    
    <h3>Order Items</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${orderItems}
        <tr>
          <td><strong>Subtotal</strong></td>
          <td style="text-align:right">$${order.totalPrice.toFixed(2)}</td>
        </tr>
        ${order.shippingPrice > 0 ? `
          <tr>
            <td>Shipping</td>
            <td style="text-align:right">$${order.shippingPrice.toFixed(2)}</td>
          </tr>
        ` : ''}
        <tr>
          <td><strong>Total</strong></td>
          <td style="text-align:right" class="total">$${order.totalPrice.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/orders/${order._id}" class="button">View Order</a>
    </div>
  `;

  return baseTemplate(content, 'Order Confirmation');
};

/**
 * Order Status Update Email
 */
export const orderStatusUpdate = (order, oldStatus, newStatus) => {
  const statusColors = {
    pending: 'status-pending',
    processing: 'status-approved',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    cancelled: 'status-rejected'
  };

  const content = `
    <h2>Order Status Update</h2>
    <p>Hi ${order.user.name},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> status has been updated.</p>
    
    <div class="info-box">
      <p><strong>Status Change</strong></p>
      <p>From: <span class="status-badge ${statusColors[oldStatus] || 'status-pending'}">${oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)}</span></p>
      <p>To: <span class="status-badge ${statusColors[newStatus] || 'status-pending'}">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
    </div>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/orders/${order._id}" class="button">Track Order</a>
    </div>
  `;

  return baseTemplate(content, 'Order Status Update');
};

/**
 * Order Shipped Email
 */
export const orderShipped = (order) => {
  const content = `
    <h2>Your Order Has Been Shipped! 🚚</h2>
    <p>Hi ${order.user.name},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has been shipped and is on its way to you.</p>
    
    <div class="info-box">
      <p><strong>Shipping Information</strong></p>
      ${order.trackingNumber ? `<p>Tracking #: ${order.trackingNumber}</p>` : ''}
      <p>Carrier: ${order.carrier || 'Standard Shipping'}</p>
    </div>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/orders/${order._id}/tracking" class="button">Track Package</a>
    </div>
  `;

  return baseTemplate(content, 'Order Shipped');
};

/**
 * Order Delivered Email
 */
export const orderDelivered = (order) => {
  const content = `
    <h2>Your Order Has Been Delivered! ✅</h2>
    <p>Hi ${order.user.name},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has been delivered.</p>
    
    <div class="info-box">
      <p><strong>Delivered</strong></p>
      <p>Date: ${new Date(order.deliveredAt).toLocaleDateString()}</p>
      <p>Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.country}</p>
    </div>
    
    <p>Thank you for shopping with us! We hope you enjoy your purchase.</p>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/orders/${order._id}" class="button">Leave a Review</a>
    </div>
  `;

  return baseTemplate(content, 'Order Delivered');
};

// ============================================
// REFUND TEMPLATES
// ============================================

/**
 * Refund Request Confirmation
 */
export const refundRequestConfirmation = (refund) => {
  const content = `
    <h2>Refund Request Received</h2>
    <p>Hi ${refund.user.name},</p>
    <p>Your refund request for order <strong>#${refund.order?.orderNumber || 'N/A'}</strong> has been received.</p>
    
    <div class="info-box">
      <p><strong>Refund Details</strong></p>
      <p>Amount: <strong>$${refund.totalAmount.toFixed(2)}</strong></p>
      <p>Status: <span class="status-badge status-pending">Pending Review</span></p>
      <p>Reason: ${refund.reason.replace('_', ' ').toUpperCase()}</p>
    </div>
    
    <p>We will review your request and get back to you within 2-3 business days.</p>
  `;

  return baseTemplate(content, 'Refund Request Received');
};

/**
 * Refund Approved Email
 */
export const refundApproved = (refund) => {
  const content = `
    <h2>Refund Approved ✅</h2>
    <p>Hi ${refund.user.name},</p>
    <p>Your refund request for order <strong>#${refund.order?.orderNumber || 'N/A'}</strong> has been approved.</p>
    
    <div class="info-box">
      <p><strong>Refund Details</strong></p>
      <p>Amount: <strong>$${refund.totalAmount.toFixed(2)}</strong></p>
      <p>Status: <span class="status-badge status-approved">Approved</span></p>
      <p>Method: ${refund.paymentMethod === 'cod' ? 'Store Credit' : 'Original Payment Method'}</p>
    </div>
    
    ${refund.paymentMethod !== 'cod' ? `
      <p>The refund will be processed to your original payment method within 3-5 business days.</p>
    ` : `
      <p>Your store credit has been added to your account.</p>
    `}
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/orders/${refund.order?._id}" class="button">View Order</a>
    </div>
  `;

  return baseTemplate(content, 'Refund Approved');
};

/**
 * Refund Rejected Email
 */
export const refundRejected = (refund) => {
  const content = `
    <h2>Refund Update</h2>
    <p>Hi ${refund.user.name},</p>
    <p>Your refund request for order <strong>#${refund.order?.orderNumber || 'N/A'}</strong> has been reviewed.</p>
    
    <div class="info-box">
      <p><strong>Decision</strong></p>
      <p>Status: <span class="status-badge status-rejected">Not Approved</span></p>
      ${refund.rejectionReason ? `<p>Reason: ${refund.rejectionReason}</p>` : ''}
    </div>
    
    <p>If you have any questions, please contact our support team.</p>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/contact" class="button button-secondary">Contact Support</a>
    </div>
  `;

  return baseTemplate(content, 'Refund Update');
};

// ============================================
// REVIEW TEMPLATES
// ============================================

/**
 * Review Approved Email
 */
export const reviewApproved = (review) => {
  const content = `
    <h2>Your Review Has Been Approved ✅</h2>
    <p>Hi ${review.user.name},</p>
    <p>Thank you for your review of <strong>${review.product.name}</strong>.</p>
    
    <div class="info-box">
      <p><strong>Your Review</strong></p>
      <p>Rating: ${'⭐'.repeat(review.rating)}</p>
      ${review.title ? `<p>Title: ${review.title}</p>` : ''}
      <p>Comment: ${review.comment}</p>
    </div>
    
    <p>Your review is now visible to other customers!</p>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/product/${review.product._id}" class="button">View Product</a>
    </div>
  `;

  return baseTemplate(content, 'Review Approved');
};

/**
 * Review Rejected Email
 */
export const reviewRejected = (review, reason) => {
  const content = `
    <h2>Your Review Update</h2>
    <p>Hi ${review.user.name},</p>
    <p>Thank you for your review of <strong>${review.product.name}</strong>.</p>
    
    <div class="info-box">
      <p><strong>Status</strong></p>
      <p>Status: <span class="status-badge status-rejected">Not Approved</span></p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
    </div>
    
    <p>You can submit a new review or update your existing one.</p>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/product/${review.product._id}" class="button button-secondary">Update Review</a>
    </div>
  `;

  return baseTemplate(content, 'Review Update');
};

/**
 * Admin Response to Review Email
 */
export const adminResponseToReview = (review) => {
  const content = `
    <h2>Admin Response to Your Review</h2>
    <p>Hi ${review.user.name},</p>
    <p>An admin has responded to your review of <strong>${review.product.name}</strong>.</p>
    
    <div class="info-box">
      <p><strong>Admin Response</strong></p>
      <p>${review.adminResponse.comment}</p>
      <p style="font-size:13px; color:#94a3b8; margin-top:8px;">
        ${new Date(review.adminResponse.createdAt).toLocaleDateString()}
      </p>
    </div>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/product/${review.product._id}" class="button">View Product</a>
    </div>
  `;

  return baseTemplate(content, 'Admin Response');
};

// ============================================
// AUTHENTICATION TEMPLATES
// ============================================

/**
 * Welcome Email
 */
export const welcomeEmail = (user) => {
  const content = `
    <h2>Welcome to ${process.env.STORE_NAME || 'Shop Store'}! 🎉</h2>
    <p>Hi ${user.name},</p>
    <p>Thank you for joining us! We're excited to have you on board.</p>
    
    <div class="info-box">
      <p><strong>Your Account</strong></p>
      <p>Email: ${user.email}</p>
      <p>Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
    </div>
    
    <p>Start exploring our products and find amazing deals.</p>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/shop" class="button">Start Shopping</a>
    </div>
  `;

  return baseTemplate(content, 'Welcome');
};

/**
 * Password Reset Email
 */
export const passwordResetEmail = (user, resetUrl) => {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hi ${user.name},</p>
    <p>We received a request to reset your password.</p>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    
    <p>This link will expire in <strong>15 minutes</strong>.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  return baseTemplate(content, 'Password Reset');
};

/**
 * Email Verification
 */
export const verificationEmail = (user, verifyUrl) => {
  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${user.name},</p>
    <p>Please verify your email address to complete your registration.</p>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${verifyUrl}" class="button">Verify Email</a>
    </div>
    
    <p>This link will expire in <strong>24 hours</strong>.</p>
  `;

  return baseTemplate(content, 'Verify Email');
};

// ============================================
// SELLER TEMPLATES
// ============================================

/**
 * Seller Registration Confirmation
 */
export const sellerRegistrationConfirmation = (user) => {
  const content = `
    <h2>Seller Registration Confirmed! 🏪</h2>
    <p>Hi ${user.name},</p>
    <p>Your seller registration for <strong>${user.sellerProfile.storeName}</strong> has been confirmed.</p>
    
    <div class="info-box">
      <p><strong>Store Information</strong></p>
      <p>Store: ${user.sellerProfile.storeName}</p>
      <p>Category: ${user.sellerProfile.storeCategory || 'Other'}</p>
      <p>Status: <span class="status-badge status-pending">Pending Review</span></p>
    </div>
    
    <p>Your store is now pending review. You will be notified once approved.</p>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/seller/dashboard" class="button">Go to Dashboard</a>
    </div>
  `;

  return baseTemplate(content, 'Seller Registration');
};

/**
 * Seller Approved Email
 */
export const sellerApproved = (user) => {
  const content = `
    <h2>Your Store Has Been Approved! ✅</h2>
    <p>Hi ${user.name},</p>
    <p>Your store <strong>${user.sellerProfile.storeName}</strong> has been approved!</p>
    
    <div class="info-box">
      <p><strong>Store Status</strong></p>
      <p>Status: <span class="status-badge status-approved">Active</span></p>
      <p>Store URL: ${process.env.CLIENT_URL}/store/${user.sellerProfile.storeSlug || user._id}</p>
    </div>
    
    <p>You can now start adding products and selling to customers!</p>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/seller/products/create" class="button">Add Your First Product</a>
    </div>
  `;

  return baseTemplate(content, 'Store Approved');
};

/**
 * New Order to Seller
 */
export const newOrderToSeller = (order, seller) => {
  const content = `
    <h2>New Order Received! 🛒</h2>
    <p>Hi ${seller.name},</p>
    <p>You have a new order for your store.</p>
    
    <div class="info-box">
      <p><strong>Order Details</strong></p>
      <p>Order #: ${order.orderNumber}</p>
      <p>Customer: ${order.user.name}</p>
      <p>Total: <strong>$${order.totalPrice.toFixed(2)}</strong></p>
    </div>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/seller/orders/${order._id}" class="button">View Order</a>
    </div>
  `;

  return baseTemplate(content, 'New Order');
};

// ============================================
// ADMIN TEMPLATES
// ============================================

/**
 * New Refund to Admin
 */
export const newRefundToAdmin = (refund) => {
  const content = `
    <h2>New Refund Request</h2>
    <p>A new refund request has been submitted.</p>
    
    <div class="info-box">
      <p><strong>Refund Details</strong></p>
      <p>Order #: ${refund.order?.orderNumber || 'N/A'}</p>
      <p>Customer: ${refund.user.name}</p>
      <p>Amount: <strong>$${refund.totalAmount.toFixed(2)}</strong></p>
      <p>Reason: ${refund.reason.replace('_', ' ').toUpperCase()}</p>
    </div>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/admin/refunds/${refund._id}" class="button">Review Refund</a>
    </div>
  `;

  return baseTemplate(content, 'New Refund');
};

/**
 * New Review to Admin
 */
export const newReviewToAdmin = (review) => {
  const content = `
    <h2>New Review Submitted</h2>
    <p>A new review has been submitted for <strong>${review.product.name}</strong>.</p>
    
    <div class="info-box">
      <p><strong>Review Details</strong></p>
      <p>Product: ${review.product.name}</p>
      <p>Customer: ${review.user.name}</p>
      <p>Rating: ${'⭐'.repeat(review.rating)}</p>
      <p>Comment: ${review.comment}</p>
    </div>
    
    <div style="text-align:center; margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/admin/reviews" class="button">Moderate Review</a>
    </div>
  `;

  return baseTemplate(content, 'New Review');
};

// ============================================
// EXPORT
// ============================================

export const emailTemplates = {
  // Order
  orderConfirmation,
  orderStatusUpdate,
  orderShipped,
  orderDelivered,
  
  // Refund
  refundRequestConfirmation,
  refundApproved,
  refundRejected,
  
  // Review
  reviewApproved,
  reviewRejected,
  adminResponseToReview,
  
  // Auth
  welcomeEmail,
  passwordResetEmail,
  verificationEmail,
  
  // Seller
  sellerRegistrationConfirmation,
  sellerApproved,
  newOrderToSeller,
  
  // Admin
  newRefundToAdmin,
  newReviewToAdmin
};

export default emailTemplates;