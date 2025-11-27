const mongoose = require('mongoose')

const kisanPaymentSchema = new mongoose.Schema(
  {
    colony: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Colony',
      required: [true, 'Colony is required'],
    },
    khatoniHolderName: {
      type: String,
      trim: true,
    },
    dateTime: {
      type: Date,
      required: [true, 'Date and time is required'],
    },
    paidAmount: {
      type: Number,
      required: [true, 'Paid amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentMode: {
      type: String,
      required: [true, 'Payment mode is required'],
      enum: ['CASH', 'CHEQUE', 'ONLINE', 'UPI', 'BANK TRANSFER'],
      default: 'CASH',
    },
    hintsInWord: {
      type: String,
      trim: true,
      default: '',
    },
    // Payment Details (optional, based on payment mode)
    chequeNumber: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    chequeDate: {
      type: Date,
    },
    upiId: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    ifscCode: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
kisanPaymentSchema.index({ dateTime: -1 })
kisanPaymentSchema.index({ colony: 1 })
kisanPaymentSchema.index({ paymentMode: 1 })

module.exports = mongoose.model('KisanPayment', kisanPaymentSchema)
