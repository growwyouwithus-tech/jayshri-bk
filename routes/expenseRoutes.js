const express = require('express')
const router = express.Router()
const Expense = require('../models/Expense')
const { protect, authorize } = require('../middleware/auth')
const { sendSuccess, sendError } = require('../middleware/responseHandler')
const { upload } = require('../middleware/upload') // Import Cloudinary upload middleware

// Get all expenses with filters
router.get('/', protect, authorize(['Admin', 'Manager']), async (req, res) => {
  try {
    const { category, mode, expenseType, property, startDate, endDate } = req.query
    const filter = {}

    if (category && category !== 'all') {
      filter.category = category
    }

    if (mode && mode !== 'all') {
      filter.mode = mode
    }

    if (expenseType && expenseType !== 'all') {
      filter.expenseType = expenseType
    }

    if (property && property !== 'all') {
      if (property === 'none') {
        filter.property = { $exists: false }
      } else {
        filter.property = property
      }
    }

    if (startDate || endDate) {
      filter.date = {}
      if (startDate) {
        filter.date.$gte = new Date(startDate)
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate)
      }
    }

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .populate('property', 'name location')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    return sendSuccess(res, 200, 'Expenses fetched successfully', { expenses })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return sendError(res, 500, 'Failed to fetch expenses')
  }
})

// Get single expense
router.get('/:id', protect, authorize(['Admin', 'Manager']), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('property', 'name location')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    if (!expense) {
      return sendError(res, 404, 'Expense not found')
    }

    return sendSuccess(res, 200, 'Expense fetched successfully', { expense })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return sendError(res, 500, 'Failed to fetch expense')
  }
})

// Create new expense
router.post('/', protect, authorize(['Admin', 'Manager']), upload.single('billFile'), async (req, res) => {
  try {
    const expenseData = {
      date: req.body.date,
      expenseType: req.body.expenseType || 'Company',
      category: req.body.category,
      amount: req.body.amount,
      mode: req.body.mode,
      vendorName: req.body.vendorName,
      remarks: req.body.remarks,
      createdBy: req.user._id,
    }

    if (req.body.property) {
      expenseData.property = req.body.property
    }

    if (req.file) {
      expenseData.billUrl = req.file.path // Cloudinary URL
    }

    const expense = await Expense.create(expenseData)

    const populatedExpense = await Expense.findById(expense._id)
      .populate('property', 'name location')
      .populate('createdBy', 'name email')

    return sendSuccess(res, 201, 'Expense created successfully', { expense: populatedExpense })
  } catch (error) {
    console.error('Error creating expense:', error)
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    return sendError(res, 500, error.message || 'Failed to create expense')
  }
})

// Update expense
router.put('/:id', protect, authorize(['Admin', 'Manager']), upload.single('billFile'), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }
      return sendError(res, 404, 'Expense not found')
    }

    if (req.body.date) expense.date = req.body.date
    if (req.body.expenseType) expense.expenseType = req.body.expenseType
    if (req.body.property !== undefined) expense.property = req.body.property || undefined
    if (req.body.category) expense.category = req.body.category
    if (req.body.amount) expense.amount = req.body.amount
    if (req.body.mode) expense.mode = req.body.mode
    if (req.body.vendorName) expense.vendorName = req.body.vendorName
    if (req.body.remarks !== undefined) expense.remarks = req.body.remarks

    if (req.file) {
      // Note: Old Cloudinary files should be deleted via Cloudinary API if needed
      expense.billUrl = req.file.path // Cloudinary URL
    }

    expense.updatedBy = req.user._id
    await expense.save()

    const populatedExpense = await Expense.findById(expense._id)
      .populate('property', 'name location')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    return sendSuccess(res, 200, 'Expense updated successfully', { expense: populatedExpense })
  } catch (error) {
    console.error('Error updating expense:', error)
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    return sendError(res, 500, error.message || 'Failed to update expense')
  }
})

// Delete expense
router.delete('/:id', protect, authorize(['Admin', 'Manager']), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      return sendError(res, 404, 'Expense not found')
    }

    if (expense.billUrl) {
      const filePath = path.join(__dirname, '..', expense.billUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await expense.deleteOne()

    return sendSuccess(res, 200, 'Expense deleted successfully')
  } catch (error) {
    console.error('Error deleting expense:', error)
    return sendError(res, 500, 'Failed to delete expense')
  }
})

// Get expense statistics
router.get('/stats/summary', protect, authorize(['Admin', 'Manager']), async (req, res) => {
  try {
    const { startDate, endDate, property, expenseType } = req.query
    const filter = {}

    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    if (property && property !== 'all') {
      filter.property = property === 'none' ? { $exists: false } : property
    }

    if (expenseType && expenseType !== 'all') {
      filter.expenseType = expenseType
    }

    const stats = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          totalCash: {
            $sum: { $cond: [{ $eq: ['$mode', 'Cash'] }, '$amount', 0] }
          },
          totalUPI: {
            $sum: { $cond: [{ $eq: ['$mode', 'UPI'] }, '$amount', 0] }
          },
          totalBank: {
            $sum: { $cond: [{ $eq: ['$mode', 'Bank'] }, '$amount', 0] }
          },
          totalCompany: {
            $sum: { $cond: [{ $eq: ['$expenseType', 'Company'] }, '$amount', 0] }
          },
          totalProperty: {
            $sum: { $cond: [{ $eq: ['$expenseType', 'Property'] }, '$amount', 0] }
          },
          count: { $sum: 1 }
        }
      }
    ])

    const result = stats.length > 0 ? stats[0] : {
      totalExpenses: 0,
      totalCash: 0,
      totalUPI: 0,
      totalBank: 0,
      totalCompany: 0,
      totalProperty: 0,
      count: 0
    }

    return sendSuccess(res, 200, 'Statistics fetched successfully', { stats: result })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return sendError(res, 500, 'Failed to fetch statistics')
  }
})

module.exports = router
