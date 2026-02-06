const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

const roles = [
  {
    name: 'Admin',
    description: 'Full system access',
    permissions: ['all'],
    level: 1,
    isActive: true
  },
  {
    name: 'Manager',
    description: 'Manage colonies, plots, and staff',
    permissions: [
      'colony_read', 'colony_create', 'colony_update', 'colony_delete',
      'plot_read', 'plot_create', 'plot_update', 'plot_delete',
      'user_read', 'user_create', 'user_update',
      'booking_read', 'booking_create', 'booking_update'
    ],
    level: 2,
    isActive: true
  },
  {
    name: 'Agent',
    description: 'View and create bookings',
    permissions: [
      'colony_read',
      'plot_read',
      'booking_read', 'booking_create'
    ],
    level: 3,
    isActive: true
  },
  {
    name: 'Lawyer',
    description: 'Manage registry documents',
    permissions: [
      'plot_read',
      'booking_read',
      'registry_read', 'registry_create', 'registry_update'
    ],
    level: 4,
    isActive: true
  }
];

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Clear existing roles
    await Role.deleteMany({});
    console.log('Existing roles cleared');

    // Insert new roles
    const createdRoles = await Role.insertMany(roles);
    console.log(`${createdRoles.length} roles created successfully:`);
    createdRoles.forEach(role => {
      console.log(`- ${role.name} (${role._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles();
