const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');

const router = express.Router();

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
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

module.exports = { router, protectCustomer };
