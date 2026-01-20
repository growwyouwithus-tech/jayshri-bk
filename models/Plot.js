const mongoose = require('mongoose');

const plotSchema = new mongoose.Schema({
  plotNumber: {
    type: String,
    required: false, // Auto-generated in pre-save hook if not provided
    trim: true
  },
  plotType: {
    type: String,
    enum: ['residential', 'commercial', 'farmhouse'],
    default: 'residential'
  },
  colony: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colony',
    required: [true, 'Colony is required']
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property is required']
  },
  area: {
    type: Number,
    required: [true, 'Plot area is required']
  },
  dimensions: {
    length: Number,
    width: Number,
    frontage: Number,
    // Adjacent features (what's on each side)
    front: String,
    back: String,
    left: String,
    right: String
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
    enum: ['seller', 'owner', 'khatoniHolder'],
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
  customerShortAddress: {
    type: String,
    trim: true
  },
  customerAadharNumber: {
    type: String,
    trim: true
  },
  customerPanNumber: {
    type: String,
    trim: true
  },
  customerDateOfBirth: {
    type: String,
    trim: true
  },
  customerSonOf: {
    type: String,
    trim: true
  },
  customerDaughterOf: {
    type: String,
    trim: true
  },
  customerWifeOf: {
    type: String,
    trim: true
  },
  customerFullAddress: {
    type: String,
    trim: true
  },
  registryDate: {
    type: Date
  },
  moreInformation: {
    type: String,
    trim: true
  },
  finalPrice: {
    type: Number
  },
  agentName: {
    type: String,
    trim: true
  },
  agentCode: {
    type: String,
    trim: true
  },
  agentPhone: {
    type: String,
    trim: true
  },
  commissionPercentage: {
    type: Number
  },
  commissionAmount: {
    type: Number
  },
  advocateName: {
    type: String,
    trim: true
  },
  advocateCode: {
    type: String,
    trim: true
  },
  advocatePhone: {
    type: String,
    trim: true
  },
  tahsil: {
    type: String,
    enum: ['agra', 'fatehabad', 'kheragarh', 'bah', 'pinahat', 'achhnera', 'etmadpur', ''],
    default: ''
  },
  modeOfPayment: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'card', ''],
    default: ''
  },
  transactionDate: {
    type: Date
  },
  //   transactionTime: {
  //     type:String,
  //    default: Date.now(),
  // },
  paidAmount: {
    type: Number
  },
  paymentSlip: {
    type: String // URL to the uploaded file
  },
  registryDocument: [{
    type: String // URL to the uploaded registry document
  }],
  registryPdf: {
    type: String // URL to the uploaded registry PDF
  },
  registryStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  // Customer/Buyer Documents
  customerDocuments: {
    aadharFront: String,
    aadharBack: String,
    panCard: String,
    passportPhoto: String,
    fullPhoto: String
  },
  // Plot Owners (from Settings) - Denormalized for historical accuracy
  plotOwners: [{
    ownerId: {
      type: String // Store the _id as string from Settings.owners
    },
    ownerName: {
      type: String,
      required: true
    },
    ownerPhone: String,
    ownerAadharNumber: String,
    ownerPanNumber: String,
    ownerDateOfBirth: String,
    ownerSonOf: String,
    ownerDaughterOf: String,
    ownerWifeOf: String,
    ownerAddress: String,
    ownerDocuments: {
      aadharFront: String,
      aadharBack: String,
      panCard: String,
      passportPhoto: String,
      fullPhoto: String
    }
  }],
  // Witnesses - Multiple witnesses can be added
  witnesses: [{
    witnessName: {
      type: String,
      required: true
    },
    witnessPhone: String,
    witnessAadharNumber: String,
    witnessPanNumber: String,
    witnessDateOfBirth: String,
    witnessSonOf: String,
    witnessDaughterOf: String,
    witnessWifeOf: String,
    witnessAddress: String,
    witnessDocuments: {
      aadharFront: String,
      aadharBack: String,
      panCard: String,
      passportPhoto: String,
      fullPhoto: String
    }
  }],
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
  plotImages: [{
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

// Generate plot number before saving if not exists
plotSchema.pre('save', async function (next) {
  // Only auto-generate plot number for new documents or if plotNumber is empty
  if (this.isNew && !this.plotNumber) {
    try {
      // Find the last plot in this colony
      const lastPlot = await this.constructor.findOne({
        colony: this.colony,
        plotNumber: /^PLOT-\d{4}$/
      }).sort({ plotNumber: -1 });

      let nextNumber = 1;
      if (lastPlot && lastPlot.plotNumber) {
        const lastNumber = parseInt(lastPlot.plotNumber.split('-')[1]);
        nextNumber = lastNumber + 1;
      }

      this.plotNumber = `PLOT-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating plot number:', error);
    }
  }

  // Calculate total price before saving
  if (this.area && this.pricePerSqFt) {
    this.totalPrice = this.area * this.pricePerSqFt;
  }
  next();
});

// Update colony plot counts after save
plotSchema.post('save', async function () {
  const Colony = mongoose.model('Colony');
  const colony = await Colony.findById(this.colony);
  if (colony) {
    await colony.updatePlotCounts();
  }
});

// Update colony plot counts after remove
plotSchema.post('remove', async function () {
  const Colony = mongoose.model('Colony');
  const colony = await Colony.findById(this.colony);
  if (colony) {
    await colony.updatePlotCounts();
  }
});

module.exports = mongoose.model('Plot', plotSchema);
