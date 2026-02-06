const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({
  mainPicture: String,
  videoUpload: String,
  mapImage: String,
  noc: String,
  registry: String,
  legalDoc: String,
  moreImages: [String]
}, { _id: false })

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Residential', 'Commercial', 'Farmhouse'],
    default: 'Residential'
  },
  categories: [{
    type: String,
    enum: ['Residential', 'Commercial', 'Farmhouse']
  }],
  colony: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colony'
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },
  area: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  totalLandAreaGaj: {
    type: Number
  },
  basePricePerGaj: {
    type: Number
  },
  tagline: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  facilities: [{
    type: String
  }],
  roads: [{
    name: String,
    lengthFt: Number,
    widthFt: Number
  }],
  parks: [{
    name: String,
    frontFt: Number,
    backFt: Number,
    leftFt: Number,
    rightFt: Number,
    areaGaj: Number
  }],
  media: {
    type: mediaSchema,
    default: () => ({ moreImages: [] })
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'ready_to_sell', 'under_development', 'sold_out'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Property', propertySchema)
