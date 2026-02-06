const express = require('express');
const { body, validationResult } = require('express-validator');
const Colony = require('../models/Colony');
const Plot = require('../models/Plot');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload');

const router = express.Router();

// @desc    Get all colonies (Public for user app)
// @route   GET /api/v1/colonies
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, city, search, status } = req.query;

    const query = {};

    if (city) query.city = city;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const colonies = await Colony.find(query)
      .populate('city', 'name state')
      .populate('createdBy', 'name email')
      .select('+pricePerSqFt') // Ensure pricePerSqFt is included
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Colony.countDocuments(query);

    res.json({
      success: true,
      data: {
        colonies: colonies,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });
  } catch (error) {
    console.error('Get colonies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get colony by ID (Public for user app)
// @route   GET /api/v1/colonies/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const colony = await Colony.findById(req.params.id)
      .populate('city', 'name state country')
      .populate('createdBy', 'name email');

    if (!colony) {
      return res.status(404).json({
        success: false,
        message: 'Colony not found'
      });
    }

    console.log('Colony found:', colony.name);
    console.log('Purchase Price:', colony.purchasePrice);
    console.log('Khatoni Holders:', colony.khatoniHolders);

    res.json({
      success: true,
      data: {
        colony: colony
      }
    });
  } catch (error) {
    console.error('Get colony error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Protected routes
router.use(protect);

// @desc    Create colony
// @route   POST /api/v1/colonies
// @access  Private (Admin, Manager)
router.post('/',
  authorize('colony_create', 'all'),
  uploadDocuments, // Add upload middleware
  [
    body('name').notEmpty().withMessage('Colony name is required'),
    body('totalArea').optional().isNumeric().withMessage('Total area must be a number'),
    body('pricePerSqFt').optional().isNumeric().withMessage('Price per sq ft must be a number'),
    body('coordinates.latitude').optional().isNumeric().withMessage('Latitude must be numeric'),
    body('coordinates.longitude').optional().isNumeric().withMessage('Longitude must be numeric')
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

      const colonyData = {
        ...req.body,
        createdBy: req.user._id
      };

      // Handle uploaded documents (Cloudinary URLs)
      if (req.files) {
        colonyData.khatoniDocuments = colonyData.khatoniDocuments || {};
        if (req.files.aadharFront) {
          colonyData.khatoniDocuments.aadharFront = req.files.aadharFront[0].path; // Cloudinary URL
        }
        if (req.files.aadharBack) {
          colonyData.khatoniDocuments.aadharBack = req.files.aadharBack[0].path; // Cloudinary URL
        }
        if (req.files.panCard) {
          colonyData.khatoniDocuments.panCard = req.files.panCard[0].path; // Cloudinary URL
        }
        if (req.files.passportPhoto) {
          colonyData.khatoniDocuments.passportPhoto = req.files.passportPhoto[0].path; // Cloudinary URL
        }
        if (req.files.fullPhoto) {
          colonyData.khatoniDocuments.fullPhoto = req.files.fullPhoto[0].path; // Cloudinary URL
        }
      }

      const colony = await Colony.create(colonyData);
      await colony.populate('city', 'name state');

      res.status(201).json({
        success: true,
        message: 'Colony created successfully',
        data: {
          colony: colony
        }
      });
    } catch (error) {
      console.error('Create colony error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);

      // Send detailed error in development
      res.status(500).json({
        success: false,
        message: error.message || 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
      });
    }
  });

// @desc    Update colony
// @route   PUT /api/v1/colonies/:id
// @access  Private (Admin, Manager)
router.put('/:id',
  authorize('colony_update', 'all'),
  uploadDocuments, // Add upload middleware
  async (req, res) => {
    try {
      const updateData = { ...req.body };

      // Handle uploaded documents (Cloudinary URLs)
      if (req.files) {
        updateData.khatoniDocuments = updateData.khatoniDocuments || {};
        if (req.files.aadharFront) {
          updateData.khatoniDocuments.aadharFront = req.files.aadharFront[0].path; // Cloudinary URL
        }
        if (req.files.aadharBack) {
          updateData.khatoniDocuments.aadharBack = req.files.aadharBack[0].path; // Cloudinary URL
        }
        if (req.files.panCard) {
          updateData.khatoniDocuments.panCard = req.files.panCard[0].path; // Cloudinary URL
        }
        if (req.files.passportPhoto) {
          updateData.khatoniDocuments.passportPhoto = req.files.passportPhoto[0].path; // Cloudinary URL
        }
        if (req.files.fullPhoto) {
          updateData.khatoniDocuments.fullPhoto = req.files.fullPhoto[0].path; // Cloudinary URL
        }
      }

      const colony = await Colony.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('city', 'name state');

      if (!colony) {
        return res.status(404).json({
          success: false,
          message: 'Colony not found'
        });
      }

      res.json({
        success: true,
        message: 'Colony updated successfully',
        data: {
          colony: colony
        }
      });
    } catch (error) {
      console.error('Update colony error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  });

// @desc    Delete colony
// @route   DELETE /api/v1/colonies/:id
// @access  Private (Admin)
router.delete('/:id', authorize('colony_delete', 'all'), async (req, res) => {
  try {
    const colony = await Colony.findById(req.params.id);

    if (!colony) {
      return res.status(404).json({
        success: false,
        message: 'Colony not found'
      });
    }

    // Check if colony has plots
    const plotCount = await Plot.countDocuments({ colony: req.params.id });
    if (plotCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete colony with existing plots'
      });
    }

    await colony.deleteOne();

    res.json({
      success: true,
      message: 'Colony deleted successfully'
    });
  } catch (error) {
    console.error('Delete colony error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Upload khatoni holder documents
// @route   POST /api/v1/colonies/:id/khatoni-holders/:holderIndex/documents
// @access  Private (Admin, Manager)
router.post('/:id/khatoni-holders/:holderIndex/documents', authorize('colony_update', 'all'), uploadDocuments, async (req, res) => {
  try {
    const colony = await Colony.findById(req.params.id);

    if (!colony) {
      return res.status(404).json({
        success: false,
        message: 'Colony not found'
      });
    }

    const holderIndex = parseInt(req.params.holderIndex);

    if (isNaN(holderIndex) || holderIndex < 0 || holderIndex >= colony.khatoniHolders.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid khatoni holder index'
      });
    }

    // Initialize documents object if it doesn't exist
    if (!colony.khatoniHolders[holderIndex].documents) {
      colony.khatoniHolders[holderIndex].documents = {};
    }

    // Update document paths from uploaded files
    // Update document paths from uploaded files
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (['aadharFront', 'aadharBack', 'panCard', 'passportPhoto', 'fullPhoto'].includes(file.fieldname)) {
          colony.khatoniHolders[holderIndex].documents[file.fieldname] = file.path;
        }
      });
    }

    await colony.save();

    res.json({
      success: true,
      message: 'Khatoni holder documents uploaded successfully',
      data: { colony }
    });
  } catch (error) {
    console.error('Upload khatoni holder documents error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
