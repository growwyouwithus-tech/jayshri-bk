const express = require('express')
const { body, validationResult } = require('express-validator')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const Property = require('../models/Property')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// @desc    Get all properties (Public for User App)
// @route   GET /api/v1/properties/public
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { status } = req.query
    const query = {}
    
    // Only filter by status if explicitly provided
    if (status) {
      query.status = status
    }

    const properties = await Property.find(query)
      .populate('colony', 'name address coordinates')
      .populate('city', 'name state')
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      success: true,
      data: { properties }
    })
  } catch (error) {
    console.error('Get public properties error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @desc    Get property by ID (Public for User App)
// @route   GET /api/v1/properties/public/:id
// @access  Public
router.get('/public/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('colony', 'name address coordinates layoutUrl')
      .populate('city', 'name state')
      .lean()

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' })
    }

    res.json({ success: true, data: { property } })
  } catch (error) {
    console.error('Get public property error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Determine a writable upload directory based on the runtime environment
// In serverless platforms (e.g., Vercel / Netlify / AWS Lambda) the default working
// directory is read-only. Only the /tmp directory is writable. We detect such
// environments via common environment variables and always fall back to /tmp to
// avoid ENOENT errors when attempting to create folders inside the read-only
// function bundle path ("/var/task").
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_REGION || process.env.LAMBDA_TASK_ROOT)

const mediaUploadDir = isServerless
  ? path.join('/tmp', 'uploads', 'properties')
  : path.join(__dirname, '../uploads/properties');

// Ensure the directory exists (and is writable). Wrap in try/catch so that the
// app still boots even if the directory cannot be created in a read-only
// environment.
try {
  if (!fs.existsSync(mediaUploadDir)) {
    fs.mkdirSync(mediaUploadDir, { recursive: true })
  }
} catch (err) {
  console.error('Could not create media upload directory:', mediaUploadDir, err.message)
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, mediaUploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({ storage })

const mediaFields = [
  { name: 'mainPicture', maxCount: 1 },
  { name: 'videoUpload', maxCount: 1 },
  { name: 'mapImage', maxCount: 1 },
  { name: 'noc', maxCount: 1 },
  { name: 'registry', maxCount: 1 },
  { name: 'legalDoc', maxCount: 1 },
  { name: 'moreImages', maxCount: 10 }
]

const parseArrayField = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (error) {
    return [value].filter(Boolean)
  }
}

const buildMediaPayload = (files, existingMedia = {}) => {
  const media = { ...existingMedia }
  const fileToPath = (file) => `/uploads/properties/${path.basename(file.path)}`

  ;['mainPicture', 'videoUpload', 'mapImage', 'noc', 'registry', 'legalDoc'].forEach((key) => {
    if (files[key]?.[0]) {
      media[key] = fileToPath(files[key][0])
    }
  })

  if (files.moreImages?.length) {
    const currentImages = existingMedia.moreImages || []
    media.moreImages = [...currentImages, ...files.moreImages.map(fileToPath)]
  } else if (!media.moreImages) {
    media.moreImages = existingMedia.moreImages || []
  }

  return media
}

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    })
  }
  return null
}

router.get('/', protect, async (req, res) => {
  try {
    const { colony, status } = req.query
    const query = {}
    if (colony) query.colony = colony
    if (status) query.status = status

    const properties = await Property.find(query)
      .populate('colony', 'name')
      .populate('city', 'name state')
      .populate('area', 'name')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: { properties }
    })
  } catch (error) {
    console.error('Get properties error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/:id', protect, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('colony', 'name')
      .populate('city', 'name state')
      .populate('area', 'name')

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' })
    }

    res.json({ success: true, data: { property } })
  } catch (error) {
    console.error('Get property error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.use(protect)

const createOrUpdateValidators = [
  body('name').notEmpty().withMessage('Property name is required'),
  body('colonyId').notEmpty().withMessage('Colony is required')
]

router.post(
  '/',
  authorize('colony_create', 'plot_create', 'all'),
  upload.fields(mediaFields),
  createOrUpdateValidators,
  async (req, res) => {
    const errorResponse = handleValidationErrors(req, res)
    if (errorResponse) return

    try {
      console.log('📥 Received property data:', req.body)
      
      const facilities = parseArrayField(req.body.facilities)
      const amenities = parseArrayField(req.body.amenities)
      const roads = parseArrayField(req.body.roads)
      const parks = parseArrayField(req.body.parks)
      const categories = parseArrayField(req.body.categories)

      console.log('📦 Parsed arrays:', { facilities, amenities, roads, parks, categories })

      // Get colony data to extract total land area
      const Colony = require('../models/Colony')
      const colonyId = req.body.colonyId || req.body.colony
      let totalLandAreaGaj = null
      
      if (colonyId) {
        const colony = await Colony.findById(colonyId)
        if (colony) {
          // Calculate from totalArea (in sq ft) or use existing totalLandAreaGaj
          totalLandAreaGaj = colony.totalArea ? Math.round(colony.totalArea / 9) : null
        }
      }

      const propertyData = {
        name: req.body.name,
        category: categories.length > 0 ? categories[0] : 'Residential',
        categories: categories,
        colony: colonyId,
        city: req.body.cityId || null,
        area: req.body.areaId || null,
        address: req.body.address,
        tagline: req.body.tagline,
        description: req.body.description,
        totalLandAreaGaj: totalLandAreaGaj,
        facilities,
        amenities,
        roads,
        parks,
        media: buildMediaPayload(req.files, { moreImages: [] }),
        coordinates: {
          latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
          longitude: req.body.longitude ? parseFloat(req.body.longitude) : null
        },
        createdBy: req.user._id
      }
      
      console.log('💾 Property data to save:', propertyData)

      const property = await Property.create(propertyData)
      await property.populate([
        { path: 'colony', select: 'name' },
        { path: 'city', select: 'name state' },
        { path: 'area', select: 'name' }
      ])

      console.log('✅ Property created successfully:', property._id)

      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: { property }
      })
    } catch (error) {
      console.error('❌ Create property error:', error)
      console.error('❌ Error details:', error.message)
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
)

router.put(
  '/:id',
  authorize('colony_update', 'plot_update', 'all'),
  upload.fields(mediaFields),
  async (req, res) => {
    try {
      console.log('📥 Updating property:', req.params.id)
      console.log('📝 Update data:', req.body)
      
      const property = await Property.findById(req.params.id)
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' })
      }

      if (req.body.name) property.name = req.body.name
      if (req.body.colonyId || req.body.colony) property.colony = req.body.colonyId || req.body.colony
      if (req.body.cityId) property.city = req.body.cityId
      if (req.body.areaId) property.area = req.body.areaId
      if (req.body.address) property.address = req.body.address
      if (req.body.tagline) property.tagline = req.body.tagline
      if (req.body.description) property.description = req.body.description

      if (req.body.facilities) {
        property.facilities = parseArrayField(req.body.facilities)
      }
      if (req.body.amenities) {
        property.amenities = parseArrayField(req.body.amenities)
      }
      if (req.body.roads) {
        property.roads = parseArrayField(req.body.roads)
      }
      if (req.body.parks) {
        property.parks = parseArrayField(req.body.parks)
      }
      if (req.body.categories) {
        const parsedCategories = parseArrayField(req.body.categories)
        property.categories = parsedCategories
        // Update single category field based on categories array
        if (parsedCategories.length > 0) {
          property.category = parsedCategories[0]
        }
      }

      // Handle coordinates update
      if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
        property.coordinates = {
          latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
          longitude: req.body.longitude ? parseFloat(req.body.longitude) : null
        }
      }

      if (req.files && Object.keys(req.files).length > 0) {
        property.media = buildMediaPayload(req.files, property.media || {})
      }

      await property.save()
      console.log('✅ Property updated successfully:', property._id)
      
      await property.populate([
        { path: 'colony', select: 'name' },
        { path: 'city', select: 'name state' },
        { path: 'area', select: 'name' }
      ])

      res.json({ success: true, message: 'Property updated successfully', data: { property } })
    } catch (error) {
      console.error('Update property error:', error)
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

router.delete(
  '/:id',
  authorize('colony_delete', 'plot_delete', 'all'),
  async (req, res) => {
    try {
      const property = await Property.findById(req.params.id)
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' })
      }

      await property.deleteOne()
      res.json({ success: true, message: 'Property deleted successfully' })
    } catch (error) {
      console.error('Delete property error:', error)
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

module.exports = router
