import rateLimit from 'express-rate-limit';

/**
 * General Rate Limiter
 * ပုံမှန် API Requests တွေအတွက်
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Health check ကို skip လုပ်မယ်
    return req.path === '/health';
  }
});

/**
 * Authentication Rate Limiter
 * Register, Forgot Password စတဲ့ Auth Routes တွေအတွက်
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Login Rate Limiter (Stricter)
 * Login attempts တွေအတွက် (Brute Force ကာကွယ်ဖို့)
 */
export const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // 5 failed attempts
  skipSuccessfulRequests: true, // အောင်မြင်ရင် count မထည့်ဘူး
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again after 30 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * API Rate Limiter (Strict)
 * Sensitive API endpoints တွေအတွက်
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  message: {
    success: false,
    message: 'API rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Admin Rate Limiter
 * Admin routes တွေအတွက် (ပိုပြီး လျှော့ထားတယ်)
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ❌ Redis Limiter ကိုဖယ်ပါ (မလိုတော့ဘူး)
// export const redisLimiter = rateLimit({ ... });