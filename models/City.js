const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  priority: {
    type: Number,
    default: 0
  },
  areas: [{
    name: {
      type: String,
      trim: true
    },
    _id: {
      type: String
    }
  }],
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('City', citySchema);
