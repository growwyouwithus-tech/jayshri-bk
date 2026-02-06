/**
 * Production-ready Data Validation and Sanitization Utilities
 * Provides comprehensive validation for all data inputs
 */

const validator = require('validator')
const { body, validationResult, param, query } = require('express-validator')

// Custom validation error class
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
    this.timestamp = new Date().toISOString()
  }
}

// Sanitization utilities
const sanitizers = {
  // String sanitization
  sanitizeString: (str) => {
    if (typeof str !== 'string') return str
    return validator.escape(validator.trim(str))
  },

  // Number sanitization
  sanitizeNumber: (num, options = {}) => {
    const { min = -Infinity, max = Infinity, defaultValue = null } = options
    
    if (num === null || num === undefined || num === '') {
      return defaultValue
    }
    
    const parsed = parseFloat(num)
    if (isNaN(parsed)) {
      return defaultValue
    }
    
    return Math.max(min, Math.min(max, parsed))
  },

  // Email sanitization
  sanitizeEmail: (email) => {
    if (typeof email !== 'string') return null
    const sanitized = validator.normalizeEmail(validator.trim(email))
    return sanitized || null
  },

  // Phone number sanitization
  sanitizePhone: (phone) => {
    if (typeof phone !== 'string') return null
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '')
    // Validate Indian phone numbers (10 digits)
    if (digitsOnly.length === 10) {
      return `+91${digitsOnly}`
    }
    // Validate international format
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return `+${digitsOnly}`
    }
    return null
  },

  // URL sanitization
  sanitizeUrl: (url) => {
    if (typeof url !== 'string') return null
    const sanitized = validator.trim(url)
    return validator.isURL(sanitized) ? sanitized : null
  },

  // Object ID validation for MongoDB
  isValidObjectId: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id)
  },

  // Date validation and sanitization
  sanitizeDate: (date) => {
    if (!date) return null
    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }
}

// Validation chains for different entities
const validations = {
  // Plot validations
  plot: {
    create: [
      // Plot number validation - optional since it's auto-generated
      body('plotNumber')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Plot number must be between 1 and 50 characters')
        .matches(/^[A-Za-z0-9\-\/\s]+$/)
        .withMessage('Plot number can only contain letters, numbers, hyphens, slashes, and spaces')
        .customSanitizer(sanitizers.sanitizeString),

      // Colony ID validation
      body('colony')
        .notEmpty()
        .withMessage('Colony ID is required')
        .custom((value) => sanitizers.isValidObjectId(value))
        .withMessage('Invalid colony ID format')
        .customSanitizer(sanitizers.sanitizeString),

      // Area validation
      body('area')
        .isNumeric()
        .withMessage('Area must be a number')
        .isFloat({ min: 50, max: 100000 })
        .withMessage('Area must be between 50 and 100,000 square feet')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 50, max: 100000 })),

      // Price per sq ft validation
      body('pricePerSqFt')
        .isNumeric()
        .withMessage('Price per sq ft must be a number')
        .isFloat({ min: 100, max: 50000 })
        .withMessage('Price per sq ft must be between ₹100 and ₹50,000')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 100, max: 50000 })),

      // Facing validation
      body('facing')
        .isIn(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'])
        .withMessage('Invalid facing direction')
        .customSanitizer(sanitizers.sanitizeString),

      // Status validation
      body('status')
        .optional()
        .isIn(['available', 'blocked', 'sold', 'reserved', 'booked'])
        .withMessage('Invalid plot status')
        .customSanitizer(sanitizers.sanitizeString),

      // Corner plot validation
      body('corner')
        .optional()
        .isBoolean()
        .withMessage('Corner must be a boolean value')
        .toBoolean(),

      // Road width validation
      body('roadWidth')
        .optional()
        .isNumeric()
        .withMessage('Road width must be a number')
        .isFloat({ min: 0, max: 200 })
        .withMessage('Road width must be between 0 and 200 feet')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 0, max: 200 })),

      // Coordinates validation
      body('coordinates.x')
        .optional()
        .isNumeric()
        .withMessage('X coordinate must be a number')
        .customSanitizer(value => sanitizers.sanitizeNumber(value)),

      body('coordinates.y')
        .optional()
        .isNumeric()
        .withMessage('Y coordinate must be a number')
        .customSanitizer(value => sanitizers.sanitizeNumber(value)),

      // Features validation
      body('features')
        .optional()
        .isArray()
        .withMessage('Features must be an array')
        .custom((value) => {
          if (!Array.isArray(value)) return false
          return value.every(feature => 
            typeof feature === 'string' && 
            feature.length <= 100 &&
            /^[A-Za-z0-9\s\-\,\.]+$/.test(feature)
          )
        })
        .withMessage('Each feature must be a valid string (max 100 characters)')
        .customSanitizer(value => {
          if (!Array.isArray(value)) return []
          return value.map(sanitizers.sanitizeString).filter(Boolean)
        }),

      // Images validation
      body('images')
        .optional()
        .isArray()
        .withMessage('Images must be an array')
        .custom((value) => {
          if (!Array.isArray(value)) return false
          return value.every(url => sanitizers.sanitizeUrl(url))
        })
        .withMessage('Each image must be a valid URL')
        .customSanitizer(value => {
          if (!Array.isArray(value)) return []
          return value.map(sanitizers.sanitizeUrl).filter(Boolean)
        }),

      // Sale Details validations
      body('customerName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Customer name must be between 2 and 100 characters')
        .matches(/^[A-Za-z\s\-\.]+$/)
        .withMessage('Customer name can only contain letters, spaces, hyphens, and periods')
        .customSanitizer(sanitizers.sanitizeString),

      body('customerNumber')
        .optional()
        .custom((value) => {
          if (!value) return true
          const sanitized = sanitizers.sanitizePhone(value)
          return sanitized !== null
        })
        .withMessage('Please provide a valid customer phone number')
        .customSanitizer(sanitizers.sanitizePhone),

      body('customerShortAddress')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Customer short address cannot exceed 200 characters')
        .customSanitizer(sanitizers.sanitizeString),

      body('customerFullAddress')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Customer full address cannot exceed 500 characters')
        .customSanitizer(sanitizers.sanitizeString),

      body('registryDate')
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage('Registry date must be a valid date')
        .customSanitizer(sanitizers.sanitizeDate),

      body('moreInformation')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('More information cannot exceed 1000 characters')
        .customSanitizer(sanitizers.sanitizeString),

      body('finalPrice')
        .optional()
        .isNumeric()
        .withMessage('Final price must be a number')
        .isFloat({ min: 0, max: 100000000 })
        .withMessage('Final price must be between 0 and 10 crores')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 0, max: 100000000 })),

      body('agentName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Agent name cannot exceed 100 characters')
        .matches(/^[A-Za-z\s\-\.]*$/)
        .withMessage('Agent name can only contain letters, spaces, hyphens, and periods')
        .customSanitizer(sanitizers.sanitizeString),

      body('agentCode')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Agent code cannot exceed 50 characters')
        .matches(/^[A-Za-z0-9\-]*$/)
        .withMessage('Agent code can only contain letters, numbers, and hyphens')
        .customSanitizer(sanitizers.sanitizeString),

      body('advocateName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Advocate name cannot exceed 100 characters')
        .matches(/^[A-Za-z\s\-\.]*$/)
        .withMessage('Advocate name can only contain letters, spaces, hyphens, and periods')
        .customSanitizer(sanitizers.sanitizeString),

      body('advocateCode')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Advocate code cannot exceed 50 characters')
        .matches(/^[A-Za-z0-9\-]*$/)
        .withMessage('Advocate code can only contain letters, numbers, and hyphens')
        .customSanitizer(sanitizers.sanitizeString),

      body('tahsil')
        .optional()
        .isIn(['agra', 'fatehabad', 'kheragarh', 'bah', 'pinahat', 'achhnera', 'etmadpur', ''])
        .withMessage('Invalid tahsil selection')
        .customSanitizer(sanitizers.sanitizeString),

      body('modeOfPayment')
        .optional()
        .isIn(['cash', 'bank_transfer', 'upi', 'cheque', 'card', ''])
        .withMessage('Invalid payment mode')
        .customSanitizer(sanitizers.sanitizeString),

      body('transactionDate')
        .optional()
        .isISO8601()
        .withMessage('Transaction date must be a valid date')
        .customSanitizer(sanitizers.sanitizeDate),

      body('paidAmount')
        .optional()
        .isNumeric()
        .withMessage('Paid amount must be a number')
        .isFloat({ min: 0, max: 100000000 })
        .withMessage('Paid amount must be between 0 and 10 crores')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 0, max: 100000000 }))
    ],

    update: [
      body('plotNumber')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Plot number must be between 1 and 50 characters')
        .matches(/^[A-Za-z0-9\-\/\s]+$/)
        .withMessage('Plot number can only contain letters, numbers, hyphens, slashes, and spaces')
        .customSanitizer(sanitizers.sanitizeString),

      body('area')
        .optional()
        .isNumeric()
        .withMessage('Area must be a number')
        .isFloat({ min: 50, max: 100000 })
        .withMessage('Area must be between 50 and 100,000 square feet')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 50, max: 100000 })),

      body('pricePerSqFt')
        .optional()
        .isNumeric()
        .withMessage('Price per sq ft must be a number')
        .isFloat({ min: 100, max: 50000 })
        .withMessage('Price per sq ft must be between ₹100 and ₹50,000')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 100, max: 50000 })),

      body('status')
        .optional()
        .isIn(['available', 'blocked', 'sold', 'reserved', 'booked'])
        .withMessage('Invalid plot status')
        .customSanitizer(sanitizers.sanitizeString),

      // Sale Details validations for update
      body('customerName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Customer name must be between 2 and 100 characters')
        .matches(/^[A-Za-z\s\-\.]+$/)
        .withMessage('Customer name can only contain letters, spaces, hyphens, and periods')
        .customSanitizer(sanitizers.sanitizeString),

      body('customerNumber')
        .optional()
        .custom((value) => {
          if (!value) return true
          const sanitized = sanitizers.sanitizePhone(value)
          return sanitized !== null
        })
        .withMessage('Please provide a valid customer phone number')
        .customSanitizer(sanitizers.sanitizePhone),

      body('customerShortAddress')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Customer short address cannot exceed 200 characters')
        .customSanitizer(sanitizers.sanitizeString),

      body('customerFullAddress')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Customer full address cannot exceed 500 characters')
        .customSanitizer(sanitizers.sanitizeString),

      body('registryDate')
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage('Registry date must be a valid date')
        .customSanitizer(sanitizers.sanitizeDate),

      body('moreInformation')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('More information cannot exceed 1000 characters')
        .customSanitizer(sanitizers.sanitizeString),

      body('finalPrice')
        .optional()
        .isNumeric()
        .withMessage('Final price must be a number')
        .isFloat({ min: 0, max: 100000000 })
        .withMessage('Final price must be between 0 and 10 crores')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 0, max: 100000000 })),

      body('agentName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Agent name cannot exceed 100 characters')
        .matches(/^[A-Za-z\s\-\.]*$/)
        .withMessage('Agent name can only contain letters, spaces, hyphens, and periods')
        .customSanitizer(sanitizers.sanitizeString),

      body('agentCode')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Agent code cannot exceed 50 characters')
        .matches(/^[A-Za-z0-9\-]*$/)
        .withMessage('Agent code can only contain letters, numbers, and hyphens')
        .customSanitizer(sanitizers.sanitizeString),

      body('advocateName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Advocate name cannot exceed 100 characters')
        .matches(/^[A-Za-z\s\-\.]*$/)
        .withMessage('Advocate name can only contain letters, spaces, hyphens, and periods')
        .customSanitizer(sanitizers.sanitizeString),

      body('advocateCode')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Advocate code cannot exceed 50 characters')
        .matches(/^[A-Za-z0-9\-]*$/)
        .withMessage('Advocate code can only contain letters, numbers, and hyphens')
        .customSanitizer(sanitizers.sanitizeString),

      body('tahsil')
        .optional()
        .isIn(['agra', 'fatehabad', 'kheragarh', 'bah', 'pinahat', 'achhnera', 'etmadpur', ''])
        .withMessage('Invalid tahsil selection')
        .customSanitizer(sanitizers.sanitizeString),

      body('modeOfPayment')
        .optional()
        .isIn(['cash', 'bank_transfer', 'upi', 'cheque', 'card', ''])
        .withMessage('Invalid payment mode')
        .customSanitizer(sanitizers.sanitizeString),

      body('transactionDate')
        .optional()
        .isISO8601()
        .withMessage('Transaction date must be a valid date')
        .customSanitizer(sanitizers.sanitizeDate),

      body('paidAmount')
        .optional()
        .isNumeric()
        .withMessage('Paid amount must be a number')
        .isFloat({ min: 0, max: 100000000 })
        .withMessage('Paid amount must be between 0 and 10 crores')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 0, max: 100000000 }))
    ]
  },

  // Colony validations
  colony: {
    create: [
      body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Colony name must be between 2 and 100 characters')
        .matches(/^[A-Za-z0-9\s\-\,\.]+$/)
        .withMessage('Colony name can only contain letters, numbers, spaces, hyphens, commas, and periods')
        .customSanitizer(sanitizers.sanitizeString),

      body('city')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City name must be between 2 and 50 characters')
        .matches(/^[A-Za-z\s\-\.]+$/)
        .withMessage('City name can only contain letters, spaces, hyphens, and periods')
        .customSanitizer(sanitizers.sanitizeString),

      body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address cannot exceed 500 characters')
        .customSanitizer(sanitizers.sanitizeString),

      body('totalPlots')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Total plots must be between 1 and 10,000')
        .toInt()
    ]
  },

  // User validations
  user: {
    register: [
      body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[A-Za-z\s\-\.]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and periods')
        .customSanitizer(sanitizers.sanitizeString),

      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('Email cannot exceed 100 characters'),

      body('phone')
        .optional()
        .custom((value) => {
          const sanitized = sanitizers.sanitizePhone(value)
          return sanitized !== null
        })
        .withMessage('Please provide a valid phone number')
        .customSanitizer(sanitizers.sanitizePhone),

      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
    ],

    login: [
      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
    ]
  },

  // Query parameter validations
  query: {
    pagination: [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt()
    ],

    plotFilters: [
      query('status')
        .optional()
        .isIn(['available', 'blocked', 'sold', 'reserved', 'booked'])
        .withMessage('Invalid status filter')
        .customSanitizer(sanitizers.sanitizeString),

      query('facing')
        .optional()
        .isIn(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'])
        .withMessage('Invalid facing filter')
        .customSanitizer(sanitizers.sanitizeString),

      query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum price must be a positive number')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 0 })),

      query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum price must be a positive number')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 0 })),

      query('minArea')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum area must be a positive number')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 0 })),

      query('maxArea')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum area must be a positive number')
        .customSanitizer(value => sanitizers.sanitizeNumber(value, { min: 0 }))
    ]
  },

  // Route parameter validations
  params: {
    objectId: [
      param('id')
        .custom((value) => sanitizers.isValidObjectId(value))
        .withMessage('Invalid ID format')
        .customSanitizer(sanitizers.sanitizeString)
    ],
    colonyId: [
      param('colonyId')
        .custom((value) => sanitizers.isValidObjectId(value))
        .withMessage('Invalid colony ID format')
        .customSanitizer(sanitizers.sanitizeString)
    ]
  }
}

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location
    }))

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorDetails,
      timestamp: new Date().toISOString()
    })
  }
  
  next()
}

// Sanitize request body middleware
const sanitizeRequest = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    } else if (obj && typeof obj === 'object') {
      const sanitized = {}
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizers.sanitizeString(value)
        } else {
          sanitized[key] = sanitizeObject(value)
        }
      }
      return sanitized
    }
    return obj
  }

  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  
  next()
}

module.exports = {
  ValidationError,
  sanitizers,
  validations,
  handleValidationErrors,
  sanitizeRequest
}