const mongoose = require('mongoose')

const kisanPaymentSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property is required'],
    },
    colony: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Colony',
      required: [true, 'Colony is required'],
    },
    paymentType: {
      type: String,
      required: [true, 'Payment type is required'],
      enum: ['CASH', 'BY CHEQUE', 'BY BANK TRANSFER'],
      default: 'CASH',
    },
    rupees: {
      type: Number,
      required: [true, 'Rupees amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    rupeesInWords: {
      type: String,
      trim: true,
      default: '',
    },
    regPlotNo: {
      type: String,
      trim: true,
      default: '',
    },
    gaj: {
      type: Number,
      default: 0,
      min: [0, 'Gaj cannot be negative'],
    },
    remark: {
      type: String,
      trim: true,
      default: '',
    },
    remainingLand: {
      type: Number,
      default: 0,
    },
    // Legacy fields for backward compatibility
    khatoniHolderName: {
      type: String,
      trim: true,
    },
    dateTime: {
      type: Date,
    },
    paidAmount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'CHEQUE', 'ONLINE', 'UPI', 'BANK TRANSFER'],
    },
    hintsInWord: {
      type: String,
      trim: true,
    },
    chequeNumber: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    voucherNo: {
      type: String,
      trim: true,
    },
    photoUrl: {
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
kisanPaymentSchema.index({ property: 1 })
kisanPaymentSchema.index({ paymentMode: 1 })
kisanPaymentSchema.index({ paymentType: 1 })

module.exports = mongoose.model('KisanPayment', kisanPaymentSchema)
