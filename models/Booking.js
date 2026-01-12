const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  plot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plot',
    required: [true, 'Plot is required']
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: [true, 'Buyer is required'] 
  },
  customerDetails: {
    name: String,
    phone: String,
    address: String,
    aadharNumber: String,
    panNumber: String
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  advanceAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  paymentSchedule: [{
    dueDate: Date,
    amount: Number,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    paidDate: Date,
    paidAmount: Number,
    transactionId: String
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  cancellationDate: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadDate: Date
  }],
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  commissions: [{
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    percentage: Number,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate booking number before saving
bookingSchema.pre('save', async function (next) {
  if (this.isNew && !this.bookingNumber) {
    const count = await this.constructor.countDocuments();
    this.bookingNumber = `BK${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate remaining amount
  if (this.totalAmount && this.advanceAmount) {
    this.remainingAmount = this.totalAmount - this.advanceAmount;
  }

  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
