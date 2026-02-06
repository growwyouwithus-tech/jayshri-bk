const express = require('express');
const { body, validationResult } = require('express-validator');
const Role = require('../models/Role');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require admin access
router.use(protect);

// @desc    Get all roles
// @route   GET /api/v1/roles
// @access  Private (Admin)
router.get('/', authorize('all'), async (req, res) => {
  try {
    const roles = await Role.find().sort({ level: 1 });
    
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

// @desc    Get role by ID
// @route   GET /api/v1/roles/:id
// @access  Private (Admin)
router.get('/:id', authorize('all'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create role
// @route   POST /api/v1/roles
// @access  Private (Admin)
router.post('/', authorize('all'), [
  body('name').notEmpty().withMessage('Role name is required'),
  body('permissions').isArray().withMessage('Permissions must be an array')
], async (req, res) => {
  try {
    console.log('Create role request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, description, permissions, level } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    const role = await Role.create({
      name,
      description,
      permissions,
      level: level || 1
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update role
// @route   PUT /api/v1/roles/:id
// @access  Private (Admin)
router.put('/:id', authorize('all'), async (req, res) => {
  try {
    const { name, description, permissions, level, isActive } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent modification of Admin role name
    if (role.name === 'Admin' && name && name !== 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change Admin role name'
      });
    }

    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;
    if (level !== undefined) role.level = level;
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete role
// @route   DELETE /api/v1/roles/:id
// @access  Private (Admin)
router.delete('/:id', authorize('all'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent deletion of system roles
    const systemRoles = ['Admin', 'Manager', 'Agent', 'Buyer', 'Lawyer', 'Colony Manager'];
    if (systemRoles.includes(role.name)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system role'
      });
    }

    await role.deleteOne();

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
