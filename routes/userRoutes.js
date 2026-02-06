const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin, Manager)
router.get('/', authorize('user_read', 'all'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, status } = req.query;

    const query = {};

    if (role) {
      if (mongoose.Types.ObjectId.isValid(role)) {
        query.role = role;
      } else {
        const roleDoc = await Role.findOne({ name: new RegExp(`^${role}$`, 'i') });
        if (!roleDoc) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role filter'
          });
        }
        query.role = roleDoc._id;
      }
    }
    if (status) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('role')
      .populate('createdBy', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'please check username and password'
    });
  }
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private (Admin, Manager)
router.post('/', authorize('user_create', 'all'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').optional().isLength({ min: 8, max: 8 }).withMessage('Password must be exactly 8 digits'),
  body('password').optional().matches(/^[0-9]{8}$/).withMessage('Password must contain exactly 8 digits'),
  body('role').notEmpty().withMessage('Role is required')
], async (req, res) => {
  try {
    console.log('Create user request body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, role, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if role exists
    const roleDoc = await Role.findById(role);
    if (!roleDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Generate default password if not provided
    const finalPassword = password || `${name.toLowerCase().replace(/\s+/g, '')}@123`;

    const user = await User.create({
      name,
      email,
      password: finalPassword,
      phone,
      role,
      address,
      createdBy: req.user._id
    });

    // Populate role to ensure userCode is generated
    await user.populate('role');

    // Save again to ensure userCode is generated if it wasn't on first save
    if (!user.userCode) {
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: password ? 'User created successfully' : 'User created with default password',
      data: user,
      ...(password ? {} : { defaultPassword: finalPassword })
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'please check username and password'
    });
  }
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin, Manager)
router.put('/:id', authorize('user_update', 'all'), async (req, res) => {
  try {
    const { name, phone, role, address, isActive, password } = req.body;

    // Find user first
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (address) user.address = address;
    if (typeof isActive !== 'undefined') user.isActive = isActive;

    // Update password if provided (will be hashed by pre-save hook)
    if (password && password.trim()) {
      user.password = password.trim();
    }

    // Save user (this triggers pre-save hooks including password hashing)
    await user.save();

    // Populate role for response
    await user.populate('role');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin)
router.delete('/:id', authorize('user_delete', 'all'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all roles
// @route   GET /api/v1/users/roles/all
// @access  Private
router.get('/roles/all', async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true }).sort({ level: 1 });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create role
// @route   POST /api/v1/users/roles
// @access  Private (Admin)
router.post('/roles', authorize('user_create', 'all'), [
  body('name').notEmpty().withMessage('Role name is required'),
  body('permissions').isArray({ min: 1 }).withMessage('At least one permission is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const role = await Role.create({
      name: req.body.name,
      description: req.body.description,
      permissions: req.body.permissions,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      level: req.body.level || 1
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ success: false, message: 'please check data is currect' });
  }
});

// @desc    Update role
// @route   PUT /api/v1/users/roles/:id
// @access  Private (Admin)
router.put('/roles/:id', authorize('user_update', 'all'), async (req, res) => {
  try {
    const { name, description, permissions, isActive, level } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (Array.isArray(permissions)) role.permissions = permissions;
    if (isActive !== undefined) role.isActive = isActive;
    if (level !== undefined) role.level = level;

    await role.save();

    res.json({ success: true, message: 'Role updated successfully', data: role });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete role
// @route   DELETE /api/v1/users/roles/:id
// @access  Private (Admin)
router.delete('/roles/:id', authorize('user_delete', 'all'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const userUsingRole = await User.findOne({ role: role._id });
    if (userUsingRole) {
      return res.status(400).json({ success: false, message: 'Cannot delete role assigned to users' });
    }

    await role.deleteOne();

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Upload user documents
// @route   POST /api/v1/users/:id/documents
// @access  Private
router.post('/:id/documents', uploadDocuments, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is updating their own documents or has permission
    if (req.user._id.toString() !== req.params.id && !req.user.permissions.includes('user_update')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user\'s documents'
      });
    }

    // Initialize documents object if it doesn't exist
    if (!user.documents) {
      user.documents = {};
    }

    // Update document paths from uploaded files (Cloudinary returns URL in .path)
    if (req.files) {
      if (req.files.aadharFront && req.files.aadharFront[0]) {
        user.documents.aadharFront = req.files.aadharFront[0].path;
      }
      if (req.files.aadharBack && req.files.aadharBack[0]) {
        user.documents.aadharBack = req.files.aadharBack[0].path;
      }
      if (req.files.panCard && req.files.panCard[0]) {
        user.documents.panCard = req.files.panCard[0].path;
      }
      if (req.files.passportPhoto && req.files.passportPhoto[0]) {
        user.documents.passportPhoto = req.files.passportPhoto[0].path;
      }
      if (req.files.fullPhoto && req.files.fullPhoto[0]) {
        user.documents.fullPhoto = req.files.fullPhoto[0].path;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: user
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
