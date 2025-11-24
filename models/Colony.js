const mongoose = require('mongoose');

const colonySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Colony name is required'],
    trim: true
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  totalArea: {
    type: Number
  },
  totalPlots: {
    type: Number,
    default: 0
  },
  availablePlots: {
    type: Number,
    default: 0
  },
  soldPlots: {
    type: Number,
    default: 0
  },
  blockedPlots: {
    type: Number,
    default: 0
  },
  pricePerSqFt: {
    type: Number
  },
  purchasePrice: {
    type: Number
  },
  amenities: [{
    name: String,
    description: String,
    image: String
  }],
  images: [{
    type: String
  }],
  layoutUrl: {
    type: String
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  status: {
    type: String,
    enum: ['planning', 'ready_to_sell', 'on_hold', 'active', 'inactive', 'sold_out', 'under_development'],
    default: 'planning'
  },
  approvals: [{
    name: String,
    number: String,
    date: Date,
    authority: String
  }],
  features: [{
    type: String
  }],
  khatoniHolders: [{
    name: {
      type: String,
      trim: true
    },
    address: String,
    mobile: String
  }],
  nearbyPlaces: [{
    name: String,
    distance: String,
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Update plot counts when plots are modified
colonySchema.methods.updatePlotCounts = async function() {
  const Plot = mongoose.model('Plot');
  const plots = await Plot.find({ colony: this._id });
  
  this.totalPlots = plots.length;
  this.availablePlots = plots.filter(plot => plot.status === 'available').length;
  this.soldPlots = plots.filter(plot => plot.status === 'sold').length;
  this.blockedPlots = plots.filter(plot => plot.status === 'blocked').length;
  
  await this.save();
};

module.exports = mongoose.model('Colony', colonySchema);
