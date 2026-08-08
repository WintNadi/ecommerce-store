import rateLimit from 'express-rate-limit';

// Development Mode မှာ Rate Limiter ကိုပိတ်ပါ
const isDevelopment = process.env.NODE_ENV === 'development';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 999999 : 100, // Development မှာ အကုန်လက်ခံမယ်
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Development မှာ အကုန် Skip လုပ်မယ်
    if (isDevelopment) return true;
    return req.path === '/health';
  }
});

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 999999 : 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment
});

// Login rate limiter
export const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: isDevelopment ? 999999 : 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again after 30 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment
});