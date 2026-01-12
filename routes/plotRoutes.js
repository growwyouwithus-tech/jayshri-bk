const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Plot = require('../models/Plot');
const Colony = require('../models/Colony');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendPaginated } = require('../middleware/responseHandler');
const { validations, handleValidationErrors, sanitizeRequest } = require('../utils/validation');

const router = express.Router();

// Configure multer for payment slip uploads
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_REGION || process.env.LAMBDA_TASK_ROOT);

const paymentSlipUploadDir = isServerless
  ? path.join('/tmp', 'uploads', 'payment-slips')
  : path.join(__dirname, '../uploads/payment-slips');

try {
  if (!fs.existsSync(paymentSlipUploadDir)) {
    fs.mkdirSync(paymentSlipUploadDir, { recursive: true });
  }
} catch (err) {
  console.error('Could not create payment slip upload directory:', paymentSlipUploadDir, err.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentSlipUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `payment-slip-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
  }
});

// @desc    Get plots by colony (Public for user app)
// @route   GET /api/v1/plots/colony/:colonyId
// @access  Public
router.get('/colony/:colonyId',
  validations.params.colonyId,
  validations.query.plotFilters,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { status, minPrice, maxPrice, minArea, maxArea, facing } = req.query;

      const query = { colony: req.params.colonyId };

      if (status) query.status = status;
      if (facing) query.facing = facing;
      if (minPrice || maxPrice) {
        query.totalPrice = {};
        if (minPrice) query.totalPrice.$gte = minPrice;
        if (maxPrice) query.totalPrice.$lte = maxPrice;
      }
      if (minArea || maxArea) {
        query.area = {};
        if (minArea) query.area.$gte = minArea;
        if (maxArea) query.area.$lte = maxArea;
      }

      const plots = await Plot.find(query)
        .populate({ path: 'colony', select: 'name city sellers' })
        .populate('currentOwner', 'name email phone')
        .sort({ plotNumber: 1 })
        .lean();

      return sendSuccess(res, 200, 'Plots fetched', { plots });
    } catch (error) {
      console.error('Get plots by colony error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @desc    Get plots by property (Public for user app)
// @route   GET /api/v1/plots/property/:propertyId
// @access  Public
router.get('/property/:propertyId',
  async (req, res) => {
    try {
      const { status, minPrice, maxPrice, minArea, maxArea, facing } = req.query;

      const query = { propertyId: req.params.propertyId };

      if (status) query.status = status;
      if (facing) query.facing = facing;
      if (minPrice || maxPrice) {
        query.totalPrice = {};
        if (minPrice) query.totalPrice.$gte = minPrice;
        if (maxPrice) query.totalPrice.$lte = maxPrice;
      }
      if (minArea || maxArea) {
        query.area = {};
        if (minArea) query.area.$gte = minArea;
        if (maxArea) query.area.$lte = maxArea;
      }

      const plots = await Plot.find(query)
        .populate({ path: 'colony', select: 'name city sellers' })
        .populate({ path: 'propertyId', select: 'name category basePricePerGaj totalLandAreaGaj address' })
        .populate('currentOwner', 'name email phone')
        .sort({ plotNumber: 1 })
        .lean();

      return sendSuccess(res, 200, 'Plots fetched', { plots });
    } catch (error) {
      console.error('Get plots by property error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @desc    Get plot by ID (Public for user app)
// @route   GET /api/v1/plots/:id
// @access  Public
router.get('/:id',
  validations.params.objectId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const plot = await Plot.findById(req.params.id)
        .populate({ path: 'colony', select: 'name city address sellers' })
        .populate({ path: 'propertyId', select: 'name category basePricePerGaj' })
        .populate('currentOwner', 'name email phone')
        .populate('createdBy', 'name email')
        .lean();

      if (!plot) {
        return res.status(404).json({
          success: false,
          message: 'Plot not found'
        });
      }

      return sendSuccess(res, 200, 'Plot fetched', { plot });
    } catch (error) {
      console.error('Get plot error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Protected routes
router.use(protect);

// @desc    Get all plots
// @route   GET /api/v1/plots
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, colony, status, search } = req.query;
    const query = {};
    if (colony) query.colony = colony;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { plotNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const plots = await Plot.find(query)
      .populate({ path: 'colony', select: 'name city sellers' })
      .populate({ path: 'propertyId', select: 'name category basePricePerGaj' })
      .populate('currentOwner', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Plot.countDocuments(query);
    const pagination = {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    };

    return sendPaginated(res, 200, 'Plots fetched', { plots }, pagination);
  } catch (error) {
    console.error('Get plots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Middleware to parse JSON stringified fields from FormData
const parseFormData = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        try {
          // Try to parse JSON strings (for objects like dimensions, sideMeasurements)
          const parsed = JSON.parse(req.body[key]);
          if (typeof parsed === 'object') {
            req.body[key] = parsed;
          }
        } catch (e) {
          // Not JSON, keep as is
        }
      }
    });
  }
  next();
};

// @desc    Create plot
// @route   POST /api/v1/plots
// @access  Private (Admin, Manager)
router.post('/',
  authorize('plot_create', 'all'),
  upload.fields([
    { name: 'paymentSlip', maxCount: 1 },
    { name: 'registryDocument', maxCount: 10 },
    { name: 'plotImages', maxCount: 10 }
  ]),
  parseFormData,
  sanitizeRequest,
  validations.plot.create,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Check if colony exists
      const colony = await Colony.findById(req.body.colony);
      if (!colony) {
        return res.status(400).json({
          success: false,
          message: 'Colony not found'
        });
      }

      // Check if plot number already exists in this colony
      const existingPlot = await Plot.findOne({
        plotNumber: req.body.plotNumber,
        colony: req.body.colony
      });

      if (existingPlot) {
        return res.status(400).json({
          success: false,
          message: 'Plot number already exists in this colony'
        });
      }

      const plotData = {
        ...req.body,
        createdBy: req.user._id
      };

      // Add file paths if files were uploaded
      if (req.files) {
        if (req.files.paymentSlip) {
          plotData.paymentSlip = `/uploads/payment-slips/${req.files.paymentSlip[0].filename}`;
        }
        if (req.files.registryDocument) {
          plotData.registryDocument = req.files.registryDocument.map(file => `/uploads/registry-documents/${file.filename}`);
        }
        if (req.files.plotImages) {
          plotData.plotImages = req.files.plotImages.map(file => `/uploads/plot-images/${file.filename}`);
        }
      }

      const plot = await Plot.create(plotData);
      await plot.populate({ path: 'colony', select: 'name city sellers' });
      return sendSuccess(res, 201, 'Plot created successfully', { plot });
    } catch (error) {
      console.error('Create plot error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @desc    Update plot
// @route   PUT /api/v1/plots/:id
// @access  Private (Admin, Manager)
router.put('/:id',
  authorize('plot_update', 'all'),
  upload.fields([
    { name: 'paymentSlip', maxCount: 1 },
    { name: 'registryDocument', maxCount: 10 },
    { name: 'plotImages', maxCount: 10 }
  ]),
  parseFormData,
  validations.params.objectId,
  sanitizeRequest,
  validations.plot.update,
  handleValidationErrors,
  async (req, res) => {
    try {
      const updateData = { ...req.body };

      // Add file paths if files were uploaded
      // Add file paths if files were uploaded
      if (req.files) {
        if (req.files.paymentSlip) {
          updateData.paymentSlip = `/uploads/payment-slips/${req.files.paymentSlip[0].filename}`;
        }
        if (req.files.registryDocument) {
          updateData.registryDocument = req.files.registryDocument.map(file => `/uploads/registry-documents/${file.filename}`);
        }
        if (req.files.plotImages) {
          updateData.plotImages = req.files.plotImages.map(file => `/uploads/plot-images/${file.filename}`);
        }
      }

      const plot = await Plot.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate({ path: 'colony', select: 'name city sellers' });

      // Check if status is booked or sold, and create a booking record if one doesn't exist
      if (plot && (plot.status === 'booked' || plot.status === 'sold')) {
        // Check for existing booking for this plot
        const existingBooking = await Booking.findOne({
          plot: plot._id,
          status: { $in: ['pending', 'confirmed', 'completed', 'approved'] }
        });

        if (!existingBooking) {
          // Create new booking with manual customer details
          const bookingData = {
            plot: plot._id,
            // (Optional) buyer: req.body.buyerId
            customerDetails: {
              name: plot.customerName,
              phone: plot.customerNumber,
              address: plot.customerShortAddress || plot.customerFullAddress,
              aadharNumber: plot.customerAadharNumber,
              panNumber: plot.customerPanNumber
            },
            totalAmount: plot.finalPrice || plot.totalPrice,
            advanceAmount: plot.paidAmount || 0,
            remainingAmount: (plot.finalPrice || plot.totalPrice) - (plot.paidAmount || 0),
            status: plot.status === 'sold' ? 'completed' : 'pending',
            bookingDate: plot.registryDate || Date.now(),
            createdBy: req.user._id
          };

          await Booking.create(bookingData);
          console.log(`Auto-created booking for plot ${plot.plotNumber}`);
        }
      }

      if (!plot) {
        return res.status(404).json({
          success: false,
          message: 'Plot not found'
        });
      }

      return sendSuccess(res, 200, 'Plot updated successfully', { plot });
    } catch (error) {
      console.error('Update plot error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @desc    Delete plot
// @route   DELETE /api/v1/plots/:id
// @access  Private (Admin)
router.delete('/:id',
  authorize('plot_delete', 'all'),
  validations.params.objectId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const plot = await Plot.findById(req.params.id);

      if (!plot) {
        return res.status(404).json({
          success: false,
          message: 'Plot not found'
        });
      }

      // Check if plot is sold or has bookings
      if (plot.status === 'sold') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete sold plot'
        });
      }

      await plot.deleteOne();

      return sendSuccess(res, 200, 'Plot deleted successfully');
    } catch (error) {
      console.error('Delete plot error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

module.exports = router;
