const express = require('express');
const Plot = require('../models/Plot');
const Colony = require('../models/Colony');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendPaginated } = require('../middleware/responseHandler');
const { validations, handleValidationErrors, sanitizeRequest } = require('../utils/validation');
const { upload } = require('../middleware/upload'); // Import Cloudinary upload middleware

const router = express.Router();

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
        .populate({ path: 'colony', select: 'name city sellers khatoniHolders' })
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
        .populate({ path: 'colony', select: 'name city address sellers khatoniHolders' })
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
      .populate({ path: 'colony', select: 'name city sellers khatoniHolders' })
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
  upload.any(), // Changed to any() to support dynamic witness fields
  parseFormData,
  sanitizeRequest,
  validations.plot.create,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Normalize req.files from array (upload.any) to object (upload.fields style)
      if (req.files && Array.isArray(req.files)) {
        const filesObject = {};
        req.files.forEach(file => {
          if (!filesObject[file.fieldname]) {
            filesObject[file.fieldname] = [];
          }
          filesObject[file.fieldname].push(file);
        });
        req.files = filesObject;
      }

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

      // Add file paths if files were uploaded (Cloudinary URLs)
      if (req.files) {
        if (req.files.paymentSlip) {
          plotData.paymentSlip = req.files.paymentSlip[0].path; // Cloudinary URL
        }
        if (req.files.registryDocument) {
          plotData.registryDocument = req.files.registryDocument.map(file => file.path); // Cloudinary URLs
        }
        if (req.files.registryPdf) {
          plotData.registryPdf = req.files.registryPdf[0].path;
        }
        if (req.files.plotImages) {
          plotData.plotImages = req.files.plotImages.map(file => file.path); // Cloudinary URLs
        }
        // Customer documents (Cloudinary URLs)
        if (req.files.customerAadharFront) {
          plotData.customerDocuments = plotData.customerDocuments || {};
          plotData.customerDocuments.aadharFront = req.files.customerAadharFront[0].path;
        }
        if (req.files.customerAadharBack) {
          plotData.customerDocuments = plotData.customerDocuments || {};
          plotData.customerDocuments.aadharBack = req.files.customerAadharBack[0].path;
        }
        if (req.files.customerPanCard) {
          plotData.customerDocuments = plotData.customerDocuments || {};
          plotData.customerDocuments.panCard = req.files.customerPanCard[0].path;
        }
        if (req.files.customerPassportPhoto) {
          plotData.customerDocuments = plotData.customerDocuments || {};
          plotData.customerDocuments.passportPhoto = req.files.customerPassportPhoto[0].path;
        }
        if (req.files.customerFullPhoto) {
          plotData.customerDocuments = plotData.customerDocuments || {};
          plotData.customerDocuments.fullPhoto = req.files.customerFullPhoto[0].path;
        }
      }

      // Handle Witness Documents (from upload.any())
      // Handle Witness Documents (from upload.any())
      // Check if any keys in the normalized 'req.files' object match the witness pattern
      const witnessFileKeys = Object.keys(req.files).filter(key => key.startsWith('witnessDocuments'));

      if (req.body.witnesses || witnessFileKeys.length > 0) {
        try {
          // Ensure witnesses is an object/array (it might be a JSON string due to FormData)
          let witnesses = [];
          if (req.body.witnesses) {
            witnesses = typeof req.body.witnesses === 'string' ? JSON.parse(req.body.witnesses) : req.body.witnesses;
          }

          if (witnessFileKeys.length > 0) {
            witnessFileKeys.forEach(key => {
              // Fieldname format: "witnessDocuments[0][aadharFront]"
              const match = key.match(/witnessDocuments\[(\d+)\]\[(\w+)\]/);
              if (match) {
                const index = parseInt(match[1]);
                const docType = match[2];

                if (witnesses[index] && req.files[key] && req.files[key][0]) {
                  witnesses[index].witnessDocuments = witnesses[index].witnessDocuments || {};
                  witnesses[index].witnessDocuments[docType] = req.files[key][0].path; // Cloudinary URL
                }
              }
            });
          }
          plotData.witnesses = witnesses;
        } catch (e) {
          console.error("Error processing witness documents:", e);
        }

      }


      // Handle plot owners selection
      if (req.body.selectedOwnerIds && req.body.selectedOwnerIds.length > 0) {
        try {
          const Settings = require('../models/Settings');
          const settings = await Settings.getInstance();

          // Parse selectedOwnerIds if it's a string
          const ownerIds = typeof req.body.selectedOwnerIds === 'string'
            ? JSON.parse(req.body.selectedOwnerIds)
            : req.body.selectedOwnerIds;

          // Fetch full owner details from Settings
          const plotOwners = [];
          for (const ownerId of ownerIds) {
            const owner = settings.owners.find(o => o._id.toString() === ownerId);
            if (owner) {
              // Store denormalized owner data
              plotOwners.push({
                ownerId: owner._id.toString(),
                ownerName: owner.name,
                ownerPhone: owner.phone || '',
                ownerAadharNumber: owner.aadharNumber || '',
                ownerPanNumber: owner.panNumber || '',
                ownerDateOfBirth: owner.dateOfBirth || '',
                ownerSonOf: owner.sonOf || '',
                ownerDaughterOf: owner.daughterOf || '',
                ownerWifeOf: owner.wifeOf || '',
                ownerAddress: owner.address || '',
                ownerDocuments: {
                  aadharFront: owner.documents?.aadharFront || '',
                  aadharBack: owner.documents?.aadharBack || '',
                  panCard: owner.documents?.panCard || '',
                  passportPhoto: owner.documents?.passportPhoto || '',
                  fullPhoto: owner.documents?.fullPhoto || ''
                }
              });
            }
          }

          if (plotOwners.length > 0) {
            plotData.plotOwners = plotOwners;
          }
        } catch (ownerError) {
          console.error('Error fetching plot owners:', ownerError);
          // Continue without owners if there's an error
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
  protect,
  authorize('plot_update', 'all'),
  upload.any(), // Changed to any() to support dynamic witness fields which Multer fields() generic does not support well
  parseFormData,
  validations.params.objectId,
  sanitizeRequest,
  validations.plot.update,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Normalize req.files from array (upload.any) to object (upload.fields style)
      let files = {};
      if (req.files && Array.isArray(req.files)) {
        const filesObject = {};
        req.files.forEach(file => {
          if (!filesObject[file.fieldname]) {
            filesObject[file.fieldname] = [];
          }
          filesObject[file.fieldname].push(file);
        });
        files = filesObject;
        req.files = filesObject;
      } else {
        files = req.files || {};
      }

      const updateData = { ...req.body };

      // Add file paths if files were uploaded (Cloudinary URLs)

      // Add file paths if files were uploaded (Cloudinary URLs)
      if (files.paymentSlip) {
        updateData.paymentSlip = files.paymentSlip[0].path; // Cloudinary URL
      }

      if (files.registryDocument || req.body.existingRegistryDocuments) {
        const newFiles = files.registryDocument ? files.registryDocument.map(file => file.path) : [];

        let existingDocs = [];
        if (req.body.existingRegistryDocuments) {
          try {
            existingDocs = JSON.parse(req.body.existingRegistryDocuments);
            if (!Array.isArray(existingDocs)) existingDocs = [existingDocs];
          } catch (e) {
            existingDocs = [req.body.existingRegistryDocuments];
          }
        }

        // Legacy case
        if (req.body.registryDocument && existingDocs.length === 0) {
          if (Array.isArray(req.body.registryDocument)) {
            existingDocs = req.body.registryDocument;
          } else {
            existingDocs = [req.body.registryDocument];
          }
        }

        // CRITICAL FIX: Aggressively flatten any nested arrays and ensure only URL strings
        const flattenArray = (arr) => {
          return arr.flat(Infinity).filter(item => item && typeof item === 'string' && item.startsWith('http'));
        };

        const flatExistingDocs = flattenArray(existingDocs);
        const flatNewFiles = flattenArray(newFiles);

        updateData.registryDocument = [...flatExistingDocs, ...flatNewFiles];
      }

      if (files.registryPdf) {
        updateData.registryPdf = files.registryPdf[0].path;
      }

      if (files.plotImages || req.body.existingPlotImages) {
        const newFiles = files.plotImages ? files.plotImages.map(file => file.path) : [];

        let existingImages = [];
        if (req.body.existingPlotImages) {
          try {
            existingImages = JSON.parse(req.body.existingPlotImages);
            if (!Array.isArray(existingImages)) existingImages = [existingImages];
          } catch (e) {
            existingImages = [req.body.existingPlotImages];
          }
        }
        // Legacy fallback
        if (req.body.plotImages && existingImages.length === 0) {
          if (Array.isArray(req.body.plotImages)) {
            existingImages = req.body.plotImages;
          } else {
            existingImages = [req.body.plotImages];
          }
        }

        // CRITICAL FIX: Aggressively flatten any nested arrays and ensure only URL strings
        const flattenArray = (arr) => {
          return arr.flat(Infinity).filter(item => item && typeof item === 'string' && item.startsWith('http'));
        };

        const flatExistingImages = flattenArray(existingImages);
        const flatNewFiles = flattenArray(newFiles);

        updateData.plotImages = [...flatExistingImages, ...flatNewFiles];
      }

      // Customer documents (Cloudinary URLs)
      if (files.customerAadharFront) {
        updateData.customerDocuments = updateData.customerDocuments || {};
        updateData.customerDocuments.aadharFront = files.customerAadharFront[0].path;
      }
      if (files.customerAadharBack) {
        updateData.customerDocuments = updateData.customerDocuments || {};
        updateData.customerDocuments.aadharBack = files.customerAadharBack[0].path;
      }
      if (files.customerPanCard) {
        updateData.customerDocuments = updateData.customerDocuments || {};
        updateData.customerDocuments.panCard = files.customerPanCard[0].path;
      }
      if (files.customerPassportPhoto) {
        updateData.customerDocuments = updateData.customerDocuments || {};
        updateData.customerDocuments.passportPhoto = files.customerPassportPhoto[0].path;
      }
      if (files.customerFullPhoto) {
        updateData.customerDocuments = updateData.customerDocuments || {};
        updateData.customerDocuments.fullPhoto = files.customerFullPhoto[0].path;
      }

      // Handle Witness Documents (Update)
      // Handle Witness Documents (Update)
      const witnessFileKeysUpdate = Object.keys(files).filter(key => key.startsWith('witnessDocuments'));

      if (req.body.witnesses || witnessFileKeysUpdate.length > 0) {
        let witnesses = [];
        if (req.body.witnesses) {
          try {
            witnesses = typeof req.body.witnesses === 'string' ? JSON.parse(req.body.witnesses) : req.body.witnesses;
          } catch (e) { }
        } else if (updateData.witnesses) {
          witnesses = updateData.witnesses;
        }

        if (witnesses.length > 0 && witnessFileKeysUpdate.length > 0) {
          witnessFileKeysUpdate.forEach(key => {
            // Fieldname format: "witnessDocuments[0][aadharFront]"
            const match = key.match(/witnessDocuments\[(\d+)\]\[(\w+)\]/);
            if (match) {
              const index = parseInt(match[1]);
              const docType = match[2];

              if (witnesses[index] && files[key] && files[key][0]) {
                witnesses[index].witnessDocuments = witnesses[index].witnessDocuments || {};
                witnesses[index].witnessDocuments[docType] = files[key][0].path;
              }
            }
          });
        }
        updateData.witnesses = witnesses;
      }


      // Handle plot owners selection (same as create)
      if (req.body.selectedOwnerIds && req.body.selectedOwnerIds.length > 0) {
        try {
          const Settings = require('../models/Settings');
          const settings = await Settings.getInstance();

          // Parse selectedOwnerIds if it's a string
          const ownerIds = typeof req.body.selectedOwnerIds === 'string'
            ? JSON.parse(req.body.selectedOwnerIds)
            : req.body.selectedOwnerIds;

          // Fetch full owner details from Settings
          const plotOwners = [];
          for (const ownerId of ownerIds) {
            const owner = settings.owners.find(o => o._id.toString() === ownerId);
            if (owner) {
              // Store denormalized owner data
              plotOwners.push({
                ownerId: owner._id.toString(),
                ownerName: owner.name,
                ownerPhone: owner.phone || '',
                ownerAadharNumber: owner.aadharNumber || '',
                ownerPanNumber: owner.panNumber || '',
                ownerDateOfBirth: owner.dateOfBirth || '',
                ownerSonOf: owner.sonOf || '',
                ownerDaughterOf: owner.daughterOf || '',
                ownerWifeOf: owner.wifeOf || '',
                ownerAddress: owner.address || '',
                ownerDocuments: {
                  aadharFront: owner.documents?.aadharFront || '',
                  aadharBack: owner.documents?.aadharBack || '',
                  panCard: owner.documents?.panCard || '',
                  passportPhoto: owner.documents?.passportPhoto || '',
                  fullPhoto: owner.documents?.fullPhoto || ''
                }
              });
            }
          }

          if (plotOwners.length > 0) {
            updateData.plotOwners = plotOwners;
          }
        } catch (ownerError) {
          console.error('Error fetching plot owners:', ownerError);
          // Continue without owners if there's an error
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
            bookingNumber: `BK-${Date.now()}`,
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
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
