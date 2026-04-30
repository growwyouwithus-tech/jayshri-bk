const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public route to submit contact form
router.post('/submit', async (req, res) => {
  try {
    const { name, phone, message } = req.body;
    
    if (!name || !phone || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, phone and message' 
      });
    }

    const contact = await Contact.create({
      name,
      phone,
      message
    });

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Message sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin routes to manage messages
router.get('/', protect, authorizeRoles('Admin', 'Manager'), async (req, res) => {
  try {
    const contacts = await Contact.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.patch('/:id/status', protect, authorizeRoles('Admin', 'Manager'), async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:id', protect, authorizeRoles('Admin', 'Manager'), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
