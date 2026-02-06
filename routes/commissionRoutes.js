const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all commissions
// @route   GET /api/v1/commissions
// @access  Private
router.get('/', async (req, res) => {
  try {
    // Placeholder for commission functionality
    res.json({
      success: true,
      data: [],
      message: 'Commission feature coming soon'
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
