import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser'; // ✅ Fixed: lowercase with hyphen
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// Import Database Connection
import db from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
// ✅ Import Seller Coupon Routes
import sellerCouponRoutes from './routes/sellerCouponRoutes.js';
// ✅ Import Admin Coupon Routes (if you have one)
import couponRoutes from './routes/couponRoutes.js';

// Import Middleware
import { protect } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// ============================================
// LOAD ENVIRONMENT VARIABLES
// ============================================
dotenv.config();

// ============================================
// INITIALIZE EXPRESS APP
// ============================================
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP Server (for Socket.io)
const httpServer = createServer(app);

// ============================================
// SOCKET.IO SETUP (Real-time Features)
// ============================================
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Join order tracking room
  socket.on('join-order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`📦 Client ${socket.id} joined order_${orderId}`);
  });

  // Join user room
  socket.on('join-user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Client ${socket.id} joined user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ============================================
// ⚠️ STRIPE WEBHOOK (Must be before express.json())
// ============================================

// Stripe Webhook - Raw body required for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
);

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition', 'X-Total-Count'],
    maxAge: 86400 // 24 hours
  })
);

// Compression for performance
app.use(
  compression({
    level: 6,
    threshold: 10 * 1024, // Only compress responses > 10KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    }
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// RATE LIMITING (Skip Order, Auth, Cart, Payment Routes)
// ============================================

// Rate Limiter - Skip order, auth, cart, and payment routes
app.use('/api', (req, res, next) => {
  // Order routes ကို Rate Limiter မသုံးပါနဲ့
  if (req.path.startsWith('/orders')) {
    return next();
  }
  // Auth routes အတွက် သီးခြား Rate Limiter ရှိတယ်
  if (req.path.startsWith('/auth')) {
    return next();
  }
  // Payment routes ကို Rate Limiter မသုံးပါနဲ့
  if (req.path.startsWith('/payments')) {
    return next();
  }
  // ✅ Cart routes ကို Rate Limiter မသုံးပါနဲ့
  if (req.path.startsWith('/cart')) {
    return next();
  }
  // ✅ Seller coupon routes ကို Rate Limiter မသုံးပါနဲ့
  if (req.path.startsWith('/seller/coupons')) {
    return next();
  }
  // ✅ Admin coupon routes ကို Rate Limiter မသုံးပါနဲ့
  if (req.path.startsWith('/coupons')) {
    return next();
  }
  generalLimiter(req, res, next);
});

// ============================================
// HEALTH CHECK ROUTES
// ============================================

// Basic Health Check
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.healthCheck();

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
      },
      database: dbStatus,
      services: {
        socketio: io.engine?.clientsCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ============================================
// API ROUTES
// ============================================

// Public Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Protected Routes
app.use('/api/orders', protect, orderRoutes);
app.use('/api/cart', protect, cartRoutes);
app.use('/api/payments', paymentRoutes); // Payment Routes

// Admin Routes
app.use('/api/admin', protect, adminRoutes);

// ✅ Seller Coupon Routes
app.use('/api/seller/coupons', sellerCouponRoutes);

// ✅ Admin Coupon Routes
app.use('/api/coupons', couponRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(errorHandler);

// ============================================
// START SERVER FUNCTION
// ============================================

const startServer = async () => {
  try {
    // 1. Connect to MongoDB First
    await db.connect();

    // 2. Start HTTP Server
    httpServer.listen(PORT, () => {
      console.log('\n═══════════════════════════════════════════════');
      console.log('🚀 E-Commerce Server Started Successfully!');
      console.log('═══════════════════════════════════════════════');
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Socket.io: Running on port ${PORT}`);
      console.log(`💾 Database: Connected`);
      console.log('═══════════════════════════════════════════════');
      console.log('✨ Features Ready:');
      console.log('  🔐 Authentication');
      console.log('  📦 Products');
      console.log('  🛒 Cart');
      console.log('  📋 Orders');
      console.log('  🏷️ Categories');
      console.log('  👑 Admin Panel');
      console.log('  💳 Stripe Payment');
      console.log('  🔍 Smart Search');
      console.log('  📊 CSV Export');
      console.log('  📍 Order Tracking');
      console.log('  🎨 Mood-Based Store');
      console.log('  🌙 Dark Mode');
      console.log('  🏷️ Coupon System'); // ✅ Added
      console.log('═══════════════════════════════════════════════\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const shutdown = async (signal) => {
  console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);

  // Close Socket.io connections
  if (io) {
    io.close(() => {
      console.log('🔌 Socket.io closed');
    });
  }

  // Close HTTP Server
  httpServer.close(async () => {
    console.log('🌐 HTTP Server closed');

    // Disconnect Database
    await db.disconnect();

    console.log('👋 Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// ============================================
// PROCESS EVENT HANDLERS
// ============================================

// Listen for shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  shutdown('uncaughtException');
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error);
  shutdown('unhandledRejection');
});

// ============================================
// START THE SERVER
// ============================================

startServer();

// Export app for testing
export default app;