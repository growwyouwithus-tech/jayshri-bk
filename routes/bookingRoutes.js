const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Plot = require('../models/Plot');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, buyer, plot } = req.query;

    const query = {};

    if (status) query.status = status;
    if (buyer) query.buyer = buyer;
    if (plot) query.plot = plot;

    const bookings = await Booking.find(query)
      .populate({
        path: 'plot',
        populate: {
          path: 'colony',
          model: 'Colony'
        }
      })
      .populate('buyer', 'name email phone')
      .populate('agent', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'plot',
        populate: {
          path: 'colony',
          model: 'Colony'
        }
      })
      .populate('buyer', 'name email phone address')
      .populate('agent', 'name email phone userCode')
      .populate('createdBy', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create booking
// @route   POST /api/v1/bookings
// @access  Private
router.post('/', [
  body('plot').notEmpty().withMessage('Plot is required'),
  // body('buyer').notEmpty().withMessage('Buyer is required'),
  body('totalAmount').isNumeric().withMessage('Total amount must be a number')
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

    const { plot, buyer, agent, totalAmount, advanceAmount, paymentSchedule } = req.body;

    // Check if plot exists and is available
    const plotDoc = await Plot.findById(plot);
    if (!plotDoc) {
      return res.status(400).json({
        success: false,
        message: 'Plot not found'
      });
    }

    if (plotDoc.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Plot is not available for booking'
      });
    }

    const bookingData = {
      plot,
      buyer,
      agent,
      totalAmount,
      advanceAmount: advanceAmount || 0,
      paymentSchedule: paymentSchedule || [],
      createdBy: req.user._id
    };

    const booking = await Booking.create(bookingData);

    // Update plot status to blocked
    plotDoc.status = 'blocked';
    await plotDoc.save();

    await booking.populate('plot buyer agent');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('plot buyer agent');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Cancel booking
// @route   PUT /api/v1/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id).populate('plot');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationDate = new Date();
    booking.cancellationReason = reason;
    await booking.save();

    // Update plot status back to available
    if (booking.plot) {
      booking.plot.status = 'available';
      await booking.plot.save();
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
