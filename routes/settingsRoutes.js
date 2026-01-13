const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload'); // Import upload middleware

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get application settings
// @route   GET /api/v1/settings
// @access  Private
router.get('/', async (req, res) => {
  try {
    const settings = {
      company: {
        name: 'Jayshri Group',
        email: 'admin@jayshree.com',
        phone: '+91 9876543210',
        address: 'Jayshri Group Office, City, State',
        website: 'https://jayshrigroup.com'
      },
      features: {
        enableNotifications: true,
        enableCommissions: true,
        enableRegistry: true,
        enableReports: true
      },
      defaults: {
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Asia/Kolkata'
      }
    };

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
      const updatedSettings = req.body;

      // Handle uploaded documents (Cloudinary URLs)
      if (req.files) {
        updatedSettings.ownerDocuments = updatedSettings.ownerDocuments || {};
        if (req.files.aadharFront) {
          updatedSettings.ownerDocuments.aadharFront = req.files.aadharFront[0].path;
        }
        if (req.files.aadharBack) {
          updatedSettings.ownerDocuments.aadharBack = req.files.aadharBack[0].path;
        }
        if (req.files.panCard) {
          updatedSettings.ownerDocuments.panCard = req.files.panCard[0].path;
        }
        if (req.files.passportPhoto) {
          updatedSettings.ownerDocuments.passportPhoto = req.files.passportPhoto[0].path;
        }
        if (req.files.fullPhoto) {
          updatedSettings.ownerDocuments.fullPhoto = req.files.fullPhoto[0].path;
        }
      }

      // Add logo handling if uploaded
      // Note: uploadDocuments middleware needs to include 'logo' field if we want to support logo upload here
      // But standard implementation usually separates 'document' uploads from 'image' uploads
      // For now, consistent with existing logic.

      res.json({
        success: true,
        message: 'Company settings updated successfully',
        data: updatedSettings
      });
    } catch (error) {
      console.error('Update company settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
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
