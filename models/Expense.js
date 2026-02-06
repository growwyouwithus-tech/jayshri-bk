const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  expenseType: {
    type: String,
    required: true,
    enum: ['Company', 'Property'],
    default: 'Company'
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: function() {
      return this.expenseType === 'Property'
    }
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Construction Materials',
      'Labor Charges',
      'Equipment Rental',
      'Transportation',
      'Legal & Documentation',
      'Marketing & Advertising',
      'Office Supplies',
      'Utilities',
      'Maintenance & Repairs',
      'Professional Fees',
      'Taxes & Licenses',
      'Insurance',
      'Salaries & Wages',
      'Miscellaneous'
    ]
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  mode: {
    type: String,
    required: true,
    enum: ['Cash', 'UPI', 'Bank'],
    default: 'Cash'
  },
  vendorName: {
    type: String,
    required: true,
    trim: true
  },
  billUrl: {
    type: String
  },
  remarks: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

expenseSchema.index({ date: -1 })
expenseSchema.index({ category: 1 })
expenseSchema.index({ mode: 1 })
expenseSchema.index({ expenseType: 1 })
expenseSchema.index({ property: 1 })
expenseSchema.index({ createdBy: 1 })

module.exports = mongoose.model('Expense', expenseSchema)
