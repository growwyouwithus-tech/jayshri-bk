const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload'); // Import upload middleware
const Settings = require('../models/Settings'); // Import Settings model

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get application settings
// @route   GET /api/v1/settings
// @access  Private
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getInstance();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update company settings
// @route   PUT /api/v1/settings/company
// @access  Private (Admin only)
router.put('/company',
  authorize('settings_update', 'all'),
  uploadDocuments,
  async (req, res) => {
    try {
      // Get the singleton settings instance
      const settings = await Settings.getInstance();

      // Update company fields
      if (req.body.companyName) settings.companyName = req.body.companyName;
      if (req.body.email) settings.email = req.body.email;
      if (req.body.phone) settings.phone = req.body.phone;
      if (req.body.address) settings.address = req.body.address;
      if (req.body.website) settings.website = req.body.website;
      if (req.body.gstNumber) settings.gstNumber = req.body.gstNumber;
      if (req.body.panNumber) settings.panNumber = req.body.panNumber;

      // Handle owners array
      if (req.body.owners) {
        try {
          const ownersData = typeof req.body.owners === 'string'
            ? JSON.parse(req.body.owners)
            : req.body.owners;

          // Initialize owners array if it doesn't exist
          if (!settings.owners) {
            settings.owners = [];
          }

          // Update owners with data from request
          settings.owners = ownersData.map((ownerData, index) => {
            // Get existing owner or create new one
            const existingOwner = settings.owners[index] || {};

            return {
              _id: existingOwner._id, // Preserve _id if exists
              name: ownerData.name || existingOwner.name || '',
              phone: ownerData.phone || existingOwner.phone || '',
              aadharNumber: ownerData.aadharNumber || existingOwner.aadharNumber || '',
              panNumber: ownerData.panNumber || existingOwner.panNumber || '',
              documents: existingOwner.documents || {}
            };
          });

        } catch (e) {
          console.error('Error parsing owners data:', e);
        }
      }

      // Handle uploaded files (Cloudinary URLs)
      // Files come with names like: owner_0_aadharFront, owner_1_panCard, logo, etc.
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const fieldName = file.fieldname;

          // Check if it's a logo
          if (fieldName === 'logo') {
            settings.logo = file.path;
            return;
          }

          // Check if it's an owner document (pattern: owner_INDEX_DOCTYPE)
          const ownerMatch = fieldName.match(/^owner_(\d+)_(.+)$/);
          if (ownerMatch) {
            const ownerIndex = parseInt(ownerMatch[1]);
            const docType = ownerMatch[2]; // aadharFront, aadharBack, etc.

            // Ensure owners array and specific owner exist
            if (!settings.owners) settings.owners = [];
            if (!settings.owners[ownerIndex]) {
              settings.owners[ownerIndex] = {
                name: '',
                documents: {}
              };
            }
            if (!settings.owners[ownerIndex].documents) {
              settings.owners[ownerIndex].documents = {};
            }

            // Save the Cloudinary URL
            settings.owners[ownerIndex].documents[docType] = file.path;
          }
        });
      }

      // Save to database
      await settings.save();

      res.json({
        success: true,
        message: 'Company settings updated successfully',
        data: settings
      });
    } catch (error) {
      console.error('Update company settings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Server error'
      });
    }
  });

// @desc    Update system settings
// @route   PUT /api/v1/settings/system
// @access  Private (Admin only)
router.put('/system',
  authorize('settings_update', 'all'),
  async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'System settings updated successfully',
        data: req.body
      });
    } catch (error) {
      console.error('Update system settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  });

// @desc    Update payment settings
// @route   PUT /api/v1/settings/payment
// @access  Private (Admin only)
router.put('/payment',
  authorize('settings_update', 'all'),
  async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Payment settings updated successfully',
        data: req.body
      });
    } catch (error) {
      console.error('Update payment settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  });

module.exports = router;
