const express = require('express');
const { body, validationResult } = require('express-validator');
const City = require('../models/City');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all cities (Public for user app)
// @route   GET /api/v1/cities
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, state } = req.query;
    
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (state) {
      query.state = { $regex: state, $options: 'i' };
    }

    const cities = await City.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Protected routes
router.use(protect);

// @desc    Create city
// @route   POST /api/v1/cities
// @access  Private (Admin, Manager)
router.post('/', authorize('city_create', 'all'), [
  body('name').notEmpty().withMessage('City name is required'),
  body('state').notEmpty().withMessage('State is required')
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

    const city = await City.create(req.body);

    res.status(201).json({
      success: true,
      message: 'City created successfully',
      data: city
    });
  } catch (error) {
    console.error('Create city error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update city
// @route   PUT /api/v1/cities/:id
// @access  Private (Admin, Manager)
router.put('/:id', authorize('city_update', 'all'), async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    res.json({
      success: true,
      message: 'City updated successfully',
      data: city
    });
  } catch (error) {
    console.error('Update city error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete city
// @route   DELETE /api/v1/cities/:id
// @access  Private (Admin)
router.delete('/:id', authorize('city_delete', 'all'), async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    await city.deleteOne();

    res.json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (error) {
    console.error('Delete city error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
