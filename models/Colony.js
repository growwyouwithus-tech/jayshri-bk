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
    trim: true
  },
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  sideMeasurements: {
    front: {
      type: Number,
      default: 0
    },
    back: {
      type: Number,
      default: 0
    },
    left: {
      type: Number,
      default: 0
    },
    right: {
      type: Number,
      default: 0
    }
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
    mobile: String,
    aadharNumber: {
      type: String,
      trim: true
    },
    panNumber: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: String,
      trim: true
    },
    sonOf: {
      type: String,
      trim: true
    },
    daughterOf: {
      type: String,
      trim: true
    },
    wifeOf: {
      type: String,
      trim: true
    },
    documents: {
      aadharFront: String,
      aadharBack: String,
      panCard: String,
      passportPhoto: String,
      fullPhoto: String
    }
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
colonySchema.methods.updatePlotCounts = async function () {
  const Plot = mongoose.model('Plot');
  const plots = await Plot.find({ colony: this._id });

  this.totalPlots = plots.length;
  this.availablePlots = plots.filter(plot => plot.status === 'available').length;
  this.soldPlots = plots.filter(plot => plot.status === 'sold').length;
  this.blockedPlots = plots.filter(plot => plot.status === 'blocked').length;

  await this.save();
};

module.exports = mongoose.model('Colony', colonySchema);
