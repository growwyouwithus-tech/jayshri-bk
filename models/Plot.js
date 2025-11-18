const mongoose = require('mongoose');

const plotSchema = new mongoose.Schema({
  plotNumber: {
    type: String,
    required: [true, 'Plot number is required'],
    trim: true
  },
  colony: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colony',
    required: [true, 'Colony is required']
  },
  area: {
    type: Number,
    required: [true, 'Plot area is required']
  },
  dimensions: {
    length: Number,
    width: Number,
    frontage: Number
  },
  pricePerSqFt: {
    type: Number,
    required: [true, 'Price per sq ft is required']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required']
  },
  status: {
    type: String,
    enum: ['available', 'blocked', 'sold', 'reserved', 'booked'],
    default: 'available'
  },
  ownerType: {
    type: String,
    enum: ['seller', 'owner'],
    default: 'owner'
  },
  // Booking/Sale Details
  customerName: {
    type: String,
    trim: true
  },
  customerNumber: {
    type: String,
    trim: true
  },
  modeOfPayment: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'card', ''],
    default: ''
  },
  transactionDate: {
    type: Date
  },
  paidAmount: {
    type: Number
  },
  paymentSlip: {
    type: String // URL to the uploaded file
  },
  registryDocument: {
    type: String // URL to the uploaded registry document
  },
  corner: {
    type: Boolean,
    default: false
  },
  facing: {
    type: String,
    enum: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'],
    required: true
  },
  roadWidth: {
    type: Number,
    default: 0
  },
  coordinates: {
    x: Number,
    y: Number
  },
  features: [{
    type: String
  }],
  nearbyAmenities: [{
    name: String,
    distance: Number
  }],
  images: [{
    type: String
  }],
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  bookingHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: String,
    date: Date,
    notes: String
  }],
  currentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  soldDate: {
    type: Date
  },
  registryDetails: {
    registryNumber: String,
    registryDate: Date,
    stampDuty: Number,
    registrationFee: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate total price before saving
plotSchema.pre('save', function(next) {
  if (this.area && this.pricePerSqFt) {
    this.totalPrice = this.area * this.pricePerSqFt;
  }
  next();
});

// Update colony plot counts after save
plotSchema.post('save', async function() {
  const Colony = mongoose.model('Colony');
  const colony = await Colony.findById(this.colony);
  if (colony) {
    await colony.updatePlotCounts();
  }
});

// Update colony plot counts after remove
plotSchema.post('remove', async function() {
  const Colony = mongoose.model('Colony');
  const colony = await Colony.findById(this.colony);
  if (colony) {
    await colony.updatePlotCounts();
  }
});

module.exports = mongoose.model('Plot', plotSchema);
