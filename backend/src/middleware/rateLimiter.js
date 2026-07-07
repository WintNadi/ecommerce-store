import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../utils/redisClient.js';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Login rate limiter (even stricter)
export const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // 5 failed attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again after 30 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Redis-based limiter (for distributed systems)
export const redisLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
