const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Plot = require('../models/Plot');
const Booking = require('../models/Booking');

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

    // Transform plots to match expected registry format, merging with Booking data if available
    const registries = await Promise.all(plots.map(async (plot) => {
      // Find the most recent confirmed/completed booking for this plot
      const booking = await Booking.findOne({ 
        plot: plot._id, 
        status: { $in: ['confirmed', 'completed'] } 
      }).populate('buyer', 'name email phone address');

      // Prioritize Booking data over Plot data for client info
      const clientName = booking?.customerDetails?.name || booking?.buyer?.name || plot.customerName || 'N/A';
      const clientPhone = booking?.customerDetails?.phone || booking?.buyer?.phone || plot.customerNumber || 'N/A';
      const clientEmail = booking?.buyer?.email || plot.customerEmail || 'N/A';
      const clientAddress = booking?.customerDetails?.address || booking?.buyer?.address || plot.customerShortAddress || 'N/A';

      return {
        _id: plot._id,
        bookingNumber: booking?.bookingNumber || plot.plotNumber, 
        plot: plot,
        buyer: {
          name: clientName,
          phone: clientPhone,
          email: clientEmail,
          address: clientAddress
        },
        bookingData: booking, // Include full booking data for detailed view
        totalAmount: booking?.totalAmount || plot.finalPrice || plot.totalPrice,
        status: plot.registryStatus || plot.status,
        bookingDate: booking?.bookingDate || plot.soldDate || plot.updatedAt,
        createdAt: plot.createdAt,
        updatedAt: plot.updatedAt,

        // ── Extended Legal Fields from Plot ──────────────────────────
        // Client identity
        customerSonOf: plot.customerSonOf || null,
        customerDaughterOf: plot.customerDaughterOf || null,
        customerWifeOf: plot.customerWifeOf || null,
        customerAadharNumber: booking?.customerDetails?.aadharNumber || plot.customerAadharNumber || null,
        customerPanNumber: booking?.customerDetails?.panNumber || plot.customerPanNumber || null,
        customerDateOfBirth: plot.customerDateOfBirth || null,
        customerFullAddress: plot.customerFullAddress || plot.customerShortAddress || clientAddress,

        // Client metadata
        clientCode: plot.clientCode || null,
        nominee: plot.nominee || null,
        nomineeRelation: plot.nomineeRelation || null,
        referralCode: plot.referralCode || null,

        // Property legal
        khasaraNo: plot.khasaraNo || null,
        plc: plot.plc || null,
        priceWithPlc: plot.priceWithPlc || null,

        // Financials
        finalPrice: plot.finalPrice || null,
        pricePerGaj: plot.pricePerGaj || (plot.pricePerSqFt ? (plot.pricePerSqFt * 9) : null),
        areaGaj: plot.areaGaj || (plot.area ? (plot.area / 9) : null),

        // Tehsil expenses (critical for Advocate verification)
        tehsilExpenses: plot.tehsilExpenses || null,
        modeOfPayment: plot.modeOfPayment || null,
        tahsil: plot.tahsil || null,
        transactionDate: plot.transactionDate || null,
        registryDate: plot.registryDate || null,

        // Agent & Advocate details
        agentName: plot.agentName || null,
        agentCode: plot.agentCode || null,
        agentPhone: plot.agentPhone || null,
        advocateName: plot.advocateName || null,
        advocateCode: plot.advocateCode || null,
        advocatePhone: plot.advocatePhone || null,
        commissionAmount: plot.commissionAmount || null,
        commissionPercentage: plot.commissionPercentage || null,

        // Additional info
        moreInformation: plot.moreInformation || null,
        paidAmount: plot.paidAmount || booking?.advanceAmount || null,
      };
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
