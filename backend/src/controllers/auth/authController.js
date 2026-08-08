import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { generateTokens } from '../../utils/generateToken.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
} from '../../utils/emailService.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

// ============================================
// REGISTER
// ============================================

/**
 * @desc    Register user with role selection
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // ✅ Admin role ကို Register ကနေ မဖန်တီးနိုင်အောင် ကာကွယ်ပါ
    const allowedRoles = ['user', 'seller'];
    const userRole = allowedRoles.includes(role) ? role : 'user';
    
    // ❌ Admin ကို Register ကနေ မဖန်တီးနိုင်ပါ
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created through registration'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: userRole
    });

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = crypto
      .createHash('sha256')
      .update(verifyToken)
      .digest('hex');
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save({ validateBeforeSave: false });

    // Send verification email
    sendVerificationEmail(user, verifyToken).catch(console.error);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Send welcome email
    sendWelcomeEmail(user).catch(console.error);

    res.status(201).json({
      success: true,
      message: `User registered successfully as ${userRole}. Please verify your email.`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// ============================================
// LOGIN
// ============================================

/**
 * @desc    Login user with role-based response
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.isLocked()) {
      const lockTime = user.getLockTimeRemaining();
      return res.status(401).json({
        success: false,
        message: `Account is locked. Please try again in ${lockTime} minutes.`
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      await user.incrementLoginAttempts();
      const remaining = 5 - user.loginAttempts;
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${remaining} attempts remaining.`
      });
    }

    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Role-based response
    const isAdmin = user.role === 'admin';
    const isSeller = user.role === 'seller';

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          profileImage: user.profileImage
        },
        accessToken,
        refreshToken,
        redirectUrl: isAdmin ? '/admin' : isSeller ? '/seller/dashboard' : '/'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// ============================================
// LOGOUT
// ============================================

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// ============================================
// GET CURRENT USER
// ============================================

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpire -verificationToken -verificationTokenExpire');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

// ============================================
// UPDATE PROFILE
// ============================================

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, preferences } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// ============================================
// CHANGE PASSWORD
// ============================================

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// ============================================
// VERIFY EMAIL
// ============================================

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};

// ============================================
// FORGOT PASSWORD
// ============================================

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email'
    });
  }
};

// ============================================
// RESET PASSWORD
// ============================================

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
};

// ============================================
// ADDRESS MANAGEMENT
// ============================================

/**
 * @desc    Add address
 * @route   POST /api/auth/address
 * @access  Private
 */
export const addAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, country, phone, label, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      street,
      city,
      state,
      zipCode,
      country: country || 'Myanmar',
      phone: phone || user.phone,
      label: label || 'Home',
      isDefault: isDefault || false
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address'
    });
  }
};

/**
 * @desc    Update address
 * @route   PUT /api/auth/address/:addressId
 * @access  Private
 */
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { street, city, state, zipCode, country, phone, label, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (country) address.country = country;
    if (phone) address.phone = phone;
    if (label) address.label = label;

    if (isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
      address.isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address'
    });
  }
};

/**
 * @desc    Delete address
 * @route   DELETE /api/auth/address/:addressId
 * @access  Private
 */
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    if (address.isDefault && user.addresses.length > 1) {
      const otherAddress = user.addresses.find(addr => addr._id.toString() !== addressId);
      if (otherAddress) {
        otherAddress.isDefault = true;
      }
    }

    user.addresses.pull(addressId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address'
    });
  }
};

// ============================================
// WISHLIST MANAGEMENT
// ============================================

/**
 * @desc    Add to wishlist
 * @route   POST /api/auth/wishlist/:productId
 * @access  Private
 */
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if product already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    user.wishlist.push(productId);
    await user.save();

    // Populate wishlist with product details
    await user.populate({
      path: 'wishlist',
      select: 'name slug price comparePrice images thumbnail rating numReviews stock isPublished isActive'
    });

    res.status(200).json({
      success: true,
      message: 'Added to wishlist',
      data: user.wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to wishlist'
    });
  }
};

/**
 * @desc    Remove from wishlist
 * @route   DELETE /api/auth/wishlist/:productId
 * @access  Private
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    // Populate wishlist with product details
    await user.populate({
      path: 'wishlist',
      select: 'name slug price comparePrice images thumbnail rating numReviews stock isPublished isActive'
    });

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist',
      data: user.wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from wishlist'
    });
  }
};

/**
 * @desc    Get wishlist with full product details
 * @route   GET /api/auth/wishlist
 * @access  Private
 */
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        select: 'name slug price comparePrice images thumbnail rating numReviews stock isPublished isActive'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.wishlist || []
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wishlist'
    });
  }
};