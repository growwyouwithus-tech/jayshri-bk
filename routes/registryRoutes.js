const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Plot = require('../models/Plot');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all registry records (sold/booked plots)
// @route   GET /api/v1/registry
// @access  Private (Lawyer/Admin)
router.get('/', async (req, res) => {
  try {
    // Build query for sold or booked plots
    let query = {
      status: { $in: ['sold', 'booked'] }
    };

    // Get role name (handle both string and object)
    const roleName = typeof req.user.role === 'string' ? req.user.role : req.user.role?.name;

    console.log('User:', req.user.name, 'Role:', roleName, 'UserCode:', req.user.userCode);

    // If user is a lawyer, filter by advocate code
    if (roleName === 'Lawyer') {
      console.log('Applying lawyer filter');

      // Filter by advocate code
      if (req.user.userCode) {
        query.advocateCode = req.user.userCode.trim();
      }
    }

    console.log('Registry query:', JSON.stringify(query));

    // Fetch plots with full population
    const plots = await Plot.find(query)
      .populate('colony')
      .populate({
        path: 'propertyId',
        populate: {
          path: 'createdBy',
          select: 'name email phone documents'
        }
      })
      .populate('currentOwner')
      .populate('createdBy', 'name email phone documents')
      .sort({ updatedAt: -1 });

    console.log(`Found ${plots.length} plots for query`);
    if (plots.length > 0) {
      console.log('Sample plot advocate codes:', plots.slice(0, 3).map(p => ({
        plotNumber: p.plotNumber,
        advocateCode: p.advocateCode,
        advocateName: p.advocateName
      })));
    }

    // Transform plots to match expected registry format
    const registries = plots.map(plot => ({
      _id: plot._id,
      bookingNumber: plot.plotNumber, // Use plot number as booking number
      plot: plot,
      buyer: {
        name: plot.customerName,
        phone: plot.customerNumber,
        email: plot.customerEmail || 'N/A'
      },
      totalAmount: plot.finalPrice || plot.totalPrice,
      status: plot.registryStatus || plot.status,
      bookingDate: plot.soldDate || plot.updatedAt,
      createdAt: plot.createdAt,
      updatedAt: plot.updatedAt
    }));

    res.json({
      success: true,
      count: registries.length,
      data: registries
    });
  } catch (error) {
    console.error('Get registry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
