const express = require('express')
const router = express.Router()
const KisanPayment = require('../models/KisanPayment')
const { protect, authorize } = require('../middleware/auth')
const { sendSuccess, sendError } = require('../middleware/responseHandler')

// Get all payments (with optional colony or property filter)
router.get('/', protect, async (req, res) => {
  try {
    const { colony, property } = req.query
    const filter = {}
    if (colony) filter.colony = colony
    if (property) filter.property = property
    
    const payments = await KisanPayment.find(filter)
      .sort({ createdAt: -1 })
      .populate('colony', 'name purchasePrice')
      .populate('property', 'name totalLandAreaGaj')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    return sendSuccess(res, 200, 'Payments fetched successfully', payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return sendError(res, 500, 'Failed to fetch payments')
  }
})

// Get single payment
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await KisanPayment.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    if (!payment) {
      return sendError(res, 404, 'Payment not found')
    }

    return sendSuccess(res, 200, 'Payment fetched successfully', payment)
  } catch (error) {
    console.error('Error fetching payment:', error)
    return sendError(res, 500, 'Failed to fetch payment')
  }
})

// Create new payment
router.post('/', protect, async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      createdBy: req.user._id,
    }

    const payment = new KisanPayment(paymentData)
    await payment.save()

    return sendSuccess(res, 201, 'Payment created successfully', payment)
  } catch (error) {
    console.error('Error creating payment:', error)
    if (error.name === 'ValidationError') {
      return sendError(res, 400, error.message)
    }
    return sendError(res, 500, 'Failed to create payment')
  }
})

// Update payment
router.put('/:id', protect, async (req, res) => {
  try {
    const payment = await KisanPayment.findById(req.params.id)

    if (!payment) {
      return sendError(res, 404, 'Payment not found')
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        payment[key] = req.body[key]
      }
    })

    payment.updatedBy = req.user._id
    await payment.save()

    return sendSuccess(res, 200, 'Payment updated successfully', payment)
  } catch (error) {
    console.error('Error updating payment:', error)
    if (error.name === 'ValidationError') {
      return sendError(res, 400, error.message)
    }
    return sendError(res, 500, 'Failed to update payment')
  }
})

// Delete payment
router.delete('/:id', protect, authorize(['Admin', 'Manager']), async (req, res) => {
  try {
    const payment = await KisanPayment.findById(req.params.id)

    if (!payment) {
      return sendError(res, 404, 'Payment not found')
    }

    await payment.deleteOne()

    return sendSuccess(res, 200, 'Payment deleted successfully')
  } catch (error) {
    console.error('Error deleting payment:', error)
    return sendError(res, 500, 'Failed to delete payment')
  }
})

// Get payment statistics
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const payments = await KisanPayment.find()

    const stats = {
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalPending: 0,
      netAmount: 0,
      totalTransactions: payments.length,
    }

    payments.forEach((payment) => {
      const amount = payment.advanceAmount || 0
      
      if (payment.transaction === 'DEPOSITED') {
        stats.totalDeposited += amount
        stats.netAmount += amount
      } else if (payment.transaction === 'WITHDRAWN') {
        stats.totalWithdrawn += amount
        stats.netAmount -= amount
      } else if (payment.transaction === 'PENDING') {
        stats.totalPending += amount
      }
    })

    return sendSuccess(res, 200, 'Statistics fetched successfully', stats)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return sendError(res, 500, 'Failed to fetch statistics')
  }
})

module.exports = router
