import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * User Schema - E-Commerce User Model
 * သုံးစွဲသူများရဲ့ အချက်အလက်တွေကို သိမ်းဆည်းမယ်
 */
const userSchema = new mongoose.Schema(
  {
    // ============================================
    // BASIC INFORMATION
    // ============================================
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't return password by default
    },

    // ============================================
    // USER ROLE & STATUS
    // ============================================
    role: {
      type: String,
      enum: ['user', 'admin', 'seller'],
      default: 'user'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },

    // ============================================
    // PROFILE
    // ============================================
    profileImage: {
      type: String,
      default: 'default-avatar.jpg'
    },
    phone: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters']
    },

    // ============================================
    // ADDRESSES
    // ============================================
    addresses: [
      {
        street: {
          type: String,
          required: true
        },
        city: {
          type: String,
          required: true
        },
        state: {
          type: String,
          required: true
        },
        zipCode: {
          type: String,
          required: true
        },
        country: {
          type: String,
          default: 'Myanmar'
        },
        phone: String,
        isDefault: {
          type: Boolean,
          default: false
        },
        label: {
          type: String,
          enum: ['Home', 'Work', 'Other'],
          default: 'Home'
        }
      }
    ],

    // ============================================
    // WISHLIST
    // ============================================
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],

    // ============================================
    // SECURITY & AUTHENTICATION
    // ============================================
    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Email Verification
    verificationToken: String,
    verificationTokenExpire: Date,

    // Refresh Token (for JWT)
    refreshToken: String,

    // Login Security
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,

    // Two-Factor Authentication (2FA)
    isTwoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,

    // ============================================
    // PREFERENCES
    // ============================================
    preferences: {
      language: {
        type: String,
        enum: ['en', 'my', 'ja'],
        default: 'en'
      },
      currency: {
        type: String,
        default: 'MMK'
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: false
        },
        push: {
          type: Boolean,
          default: true
        }
      }
    },

    // ============================================
    // SOCIAL LOGIN
    // ============================================
    googleId: String,
    facebookId: String,

    // ============================================
    // METADATA
    // ============================================
    lastActive: Date,
    registeredFrom: {
      type: String,
      enum: ['direct', 'google', 'facebook'],
      default: 'direct'
    }
  },
  {
    timestamps: true // Adds createdAt & updatedAt
  }
);

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

// Unique indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ facebookId: 1 }, { sparse: true });

// Query indexes
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ 'addresses.city': 1 });
userSchema.index({ createdAt: -1 });

// Compound indexes
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ email: 1, role: 1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Compare entered password with hashed password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if account is locked
 */
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Get remaining lock time in minutes
 */
userSchema.methods.getLockTimeRemaining = function () {
  if (!this.lockUntil) return 0;
  const remaining = Math.ceil((this.lockUntil - Date.now()) / 1000 / 60);
  return remaining > 0 ? remaining : 0;
};

/**
 * Increment login attempts and lock if needed
 */
userSchema.methods.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;

  // Lock after 5 failed attempts
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
  }

  await this.save({ validateBeforeSave: false });
};

/**
 * Reset login attempts on successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save({ validateBeforeSave: false });
};

/**
 * Get user's default address
 */
userSchema.methods.getDefaultAddress = function () {
  return this.addresses.find((addr) => addr.isDefault) || this.addresses[0] || null;
};

/**
 * Get user's full name (for display)
 */
userSchema.methods.getDisplayName = function () {
  return this.name || this.email.split('@')[0];
};

/**
 * Check if user has address
 */
userSchema.methods.hasAddress = function () {
  return this.addresses && this.addresses.length > 0;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find user by email (case insensitive)
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find active users (not locked)
 */
userSchema.statics.findActiveUsers = function () {
  return this.find({
    isActive: true,
    $or: [{ lockUntil: { $exists: false } }, { lockUntil: { $lt: Date.now() } }]
  });
};

/**
 * Get user statistics
 */
userSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        verifiedUsers: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        },
        adminUsers: {
          $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
        },
        sellerUsers: {
          $sum: { $cond: [{ $eq: ['$role', 'seller'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0,
    sellerUsers: 0
  };
};

// ============================================
// TOJSON TRANSFORM
// ============================================

userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    delete ret.verificationToken;
    delete ret.verificationTokenExpire;
    delete ret.refreshToken;
    delete ret.twoFactorSecret;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  }
});

// ============================================
// EXPORT MODEL
// ============================================

const User = mongoose.model('User', userSchema);
export default User;