const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const { sendOTPEmail } = require('../utils/emailService');

const router = express.Router();

// In-memory OTP storage (for development - use Redis in production)
const otpStore = new Map();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Middleware to protect customer routes
const protectCustomer = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'customer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    req.customer = await Customer.findById(decoded.id);
    
    if (!req.customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// @desc    Register customer (User App)
// @route   POST /api/v1/customer-auth/register
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8, max: 8 }).withMessage('Password must be exactly 8 digits'),
  body('password').matches(/^[0-9]{8}$/).withMessage('Password must contain exactly 8 digits'),
  body('phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, referredBy, agentCode } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists with this email'
      });
    }

    // Create customer
    const customerData = {
      name,
      email,
      password,
      phone
    };

    // Handle agent code validation
    if (agentCode) {
      const User = require('../models/User');
      const Role = require('../models/Role');
      
      // Find agent role
      const agentRole = await Role.findOne({ name: 'Agent' });
      
      if (agentRole) {
        // Find user with this code and agent role
        const agent = await User.findOne({ 
          userCode: agentCode.trim().toUpperCase(),
          role: agentRole._id,
          isActive: true
        });
        
        if (agent) {
          customerData.agentId = agent._id;
          customerData.agentCode = agentCode.trim().toUpperCase();
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid Agent Code. Please check and try again.'
          });
        }
      }
    }

    // Handle referral
    if (referredBy) {
      const referrer = await Customer.findOne({ referralCode: referredBy });
      if (referrer) {
        customerData.referredBy = referrer._id;
      }
    }

    const customer = await Customer.create(customerData);

    // Generate token
    const token = generateToken(customer._id);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        customer,
        token
      }
    });
  } catch (error) {
    console.error('Customer register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @desc    Login customer (User App)
// @route   POST /api/v1/customer-auth/login
// @access  Public
router.post('/login', [
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, phone, password } = req.body;

    // Validate that either email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or phone number'
      });
    }

    // Check if customer exists by email or phone
    const query = email ? { email } : { phone };
    const customer = await Customer.findOne(query).select('+password');
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if customer is active
    if (!customer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await customer.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    customer.lastLogin = new Date();
    await customer.save();

    // Generate token
    const token = generateToken(customer._id);

    // Remove password from response
    customer.password = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        customer,
        token
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @desc    Get current customer
// @route   GET /api/v1/customer-auth/me
// @access  Private (Customer)
router.get('/me', protectCustomer, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update customer profile
// @route   PUT /api/v1/customer-auth/profile
// @access  Private (Customer)
router.put('/profile', protectCustomer, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, phone, address } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.customer._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// @desc    Change customer password
// @route   PUT /api/v1/customer-auth/change-password
// @access  Private (Customer)
router.put('/change-password', protectCustomer, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8, max: 8 }).withMessage('New password must be exactly 8 digits'),
  body('newPassword').matches(/^[0-9]{8}$/).withMessage('New password must contain exactly 8 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get customer with password
    const customer = await Customer.findById(req.customer._id).select('+password');

    // Check current password
    const isCurrentPasswordValid = await customer.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    customer.password = newPassword;
    await customer.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change customer password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

// @desc    Get customer's bookings
// @route   GET /api/v1/customer-auth/my-bookings
// @access  Private (Customer)
router.get('/my-bookings', protectCustomer, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    
    // Find bookings where buyer matches customer
    const bookings = await Booking.find({ buyer: req.customer._id })
      .populate({
        path: 'plot',
        select: 'plotNumber plotNo area areaGaj facing cornerPlot totalPrice pricePerGaj status',
        populate: {
          path: 'colony',
          select: 'name location'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
});

// @desc    Send OTP for password reset
// @route   POST /api/v1/customer-auth/forgot-password
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if customer exists
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiry (10 minutes)
    const otpData = {
      otp,
      email,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    };
    otpStore.set(email, otpData);

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp, customer.name);
      
      res.json({
        success: true,
        message: 'OTP sent to your email address'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still return success with OTP in dev mode
      if (process.env.NODE_ENV === 'development') {
        res.json({
          success: true,
          message: 'OTP sent (check console in dev mode)',
          devOTP: otp // Only in development
        });
      } else {
        throw emailError;
      }
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again later.'
    });
  }
});

// @desc    Verify OTP
// @route   POST /api/v1/customer-auth/verify-otp
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    // Get OTP data from store
    const otpData = otpStore.get(email);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check attempts
    if (otpData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      otpStore.set(email, otpData);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.`
      });
    }

    // OTP verified successfully
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    });
  }
});

// @desc    Reset password
// @route   POST /api/v1/customer-auth/reset-password
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 8, max: 8 }).withMessage('Password must be exactly 8 digits'),
  body('newPassword').matches(/^[0-9]{8}$/).withMessage('Password must contain exactly 8 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, otp, newPassword } = req.body;

    // Get OTP data from store
    const otpData = otpStore.get(email);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.'
      });
    }

    // Verify OTP one more time
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find customer and update password
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update password
    customer.password = newPassword;
    await customer.save();

    // Clear OTP from store
    otpStore.delete(email);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
});

module.exports = { router, protectCustomer };
