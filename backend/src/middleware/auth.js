import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * JWT Token ကို Verify လုပ်ပြီး User ကို Request ထဲထည့်ပေးမယ်
 */

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.'
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        const lockTime = user.getLockTimeRemaining();
        return res.status(401).json({
          success: false,
          message: `Account is locked. Please try again in ${lockTime} minutes.`
        });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
          expired: true
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.'
    });
  }
};

// ============================================
// ROLE-BASED AUTHORIZATION
// ============================================

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`
      });
    }

    next();
  };
};

// ============================================
// OPTIONAL AUTHENTICATION
// ============================================

/**
 * Optional authentication (for public routes that show user data if logged in)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid - just continue without user
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// ============================================
// RATE LIMIT BY USER
// ============================================

/**
 * Rate limit by user (premium users get higher limits)
 */
export const rateLimitByUser = (limits) => {
  return (req, res, next) => {
    let limit = limits.default || 100;

    if (req.user) {
      if (req.user.role === 'admin') {
        limit = limits.admin || 1000;
      } else if (req.user.role === 'seller') {
        limit = limits.seller || 500;
      } else if (req.user.isVerified) {
        limit = limits.verified || 200;
      }
    }

    req.rateLimit = limit;
    next();
  };
};

// ============================================
// ACCOUNT OWNERSHIP VERIFICATION
// ============================================

/**
 * Verify if user owns the resource
 */
export const verifyOwnership = (getResourceId) => {
  return async (req, res, next) => {
    try {
      const resourceId = getResourceId(req);
      const userId = req.user._id;

      // Check if user is admin (admin can access anything)
      if (req.user.role === 'admin') {
        return next();
      }

      // Get resource
      const Model = req.resourceModel;
      if (!Model) {
        return res.status(400).json({
          success: false,
          message: 'Resource model not defined'
        });
      }

      const resource = await Model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource
      if (resource.user && resource.user.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Verify ownership error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying ownership'
      });
    }
  };
};

// ============================================
// SESSION VALIDATION
// ============================================

/**
 * Validate user session (check if user still exists and is active)
 */
export const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Check if user still exists in database
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists. Please login again.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation error'
    });
  }
};