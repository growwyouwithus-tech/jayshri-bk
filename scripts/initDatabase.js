const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Role = require('../models/Role');
const User = require('../models/User');
const City = require('../models/City');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Initialize roles
const initRoles = async () => {
  try {
    console.log('Initializing roles...');
    
    const roles = [
      {
        name: 'Admin',
        description: 'Full system access',
        permissions: ['all'],
        level: 10
      },
      {
        name: 'Manager',
        description: 'Management level access',
        permissions: [
          'user_read', 'user_create', 'user_update',
          'colony_read', 'colony_create', 'colony_update',
          'plot_read', 'plot_create', 'plot_update',
          'booking_read', 'booking_create', 'booking_update',
          'city_read', 'city_create', 'city_update'
        ],
        level: 8
      },
      {
        name: 'Agent',
        description: 'Sales agent access',
        permissions: [
          'colony_read', 'plot_read', 'booking_read', 'booking_create', 'booking_update'
        ],
        level: 5
      },
      {
        name: 'Buyer',
        description: 'Customer access',
        permissions: ['colony_read', 'plot_read', 'booking_read'],
        level: 1
      },
      {
        name: 'Lawyer',
        description: 'Legal documentation access',
        permissions: [
          'colony_read', 'plot_read', 'booking_read', 'registry_read', 'registry_create', 'registry_update'
        ],
        level: 6
      },
      {
        name: 'Colony Manager',
        description: 'Colony and plot management access',
        permissions: [
          'plot_read', 'plot_create', 'plot_update', 'plot_delete',
          'colony_read'
        ],
        level: 7
      }
    ];

    for (const roleData of roles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
        console.log(`Created role: ${roleData.name}`);
      } else {
        console.log(`Role already exists: ${roleData.name}`);
      }
    }
  } catch (error) {
    console.error('Error initializing roles:', error);
  }
};

// Initialize admin user
const initAdminUser = async () => {
  try {
    console.log('Initializing admin user...');
    
    const adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      console.error('Admin role not found');
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@jayshree.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const adminUser = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123',
        phone: '+91 9876543210',
        role: adminRole._id,
        address: {
          street: 'Jayshri Group Office',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      });
      
      console.log(`Created admin user: ${adminUser.email}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
};

// Initialize sample cities
const initCities = async () => {
  try {
    console.log('Initializing sample cities...');
    
    const cities = [
      { name: 'Mumbai', state: 'Maharashtra', country: 'India' },
      { name: 'Pune', state: 'Maharashtra', country: 'India' },
      { name: 'Nashik', state: 'Maharashtra', country: 'India' },
      { name: 'Nagpur', state: 'Maharashtra', country: 'India' },
      { name: 'Aurangabad', state: 'Maharashtra', country: 'India' }
    ];

    for (const cityData of cities) {
      const existingCity = await City.findOne({ name: cityData.name, state: cityData.state });
      if (!existingCity) {
        await City.create(cityData);
        console.log(`Created city: ${cityData.name}`);
      } else {
        console.log(`City already exists: ${cityData.name}`);
      }
    }
  } catch (error) {
    console.error('Error initializing cities:', error);
  }
};

// Main initialization function
const initDatabase = async () => {
  try {
    await connectDB();
    
    console.log('Starting database initialization...');
    
    await initRoles();
    await initAdminUser();
    await initCities();
    
    console.log('Database initialization completed successfully!');
    console.log('\nLogin credentials:');
    console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@jayshree.com'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization
initDatabase();
