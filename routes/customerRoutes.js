const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/v1/customers
 * @desc    Get all customers (Admin only)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('Admin', 'Manager', 'Agent'), async (req, res) => {
  try {
    const { search, page = 1, limit = 50, agentCode } = req.query;
    
    let query = {};
    
    // Filter by agent code if provided (for agent dashboard)
    if (agentCode) {
      query.agentCode = agentCode.trim().toUpperCase();
    }
    
    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const customers = await Customer.find(query)
      .select('-password')
      .populate('agentId', 'name email userCode')
      .populate({
        path: 'bookings',
        select: 'bookingNumber totalAmount paidAmount status createdAt',
        populate: {
          path: 'plot',
          select: 'plotNo plotNumber'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Customer.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get single customer
 * @access  Private/Admin
 */
router.get('/:id', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .select('-password')
      .populate('referredBy', 'name email');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { name, email, phone, isActive } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Update fields
    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (typeof isActive !== 'undefined') customer.isActive = isActive;
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Delete customer
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    await customer.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
});

module.exports = router;
