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
          'user_read', 'user_create', 'user_update', 'users_read',
          'colony_read', 'colony_create', 'colony_update', 'colonies_read', 'colonies_create',
          'plot_read', 'plot_create', 'plot_update', 'plots_read', 'plots_create',
          'booking_read', 'booking_create', 'booking_update', 'bookings_read', 'bookings_create',
          'city_read', 'city_create', 'city_update', 'cities_read',
          'registry_read', 'registry_create', 'registries_read',
          'commission_read', 'commissions_read',
          'calculator_read',
          'property_read', 'properties_read'
        ],
        level: 8
      },
      {
        name: 'Agent',
        description: 'Sales agent access',
        permissions: [
          'colony_read', 'colonies_read',
          'plot_read', 'plots_read',
          'booking_read', 'booking_create', 'booking_update', 'bookings_read', 'bookings_create',
          'commission_read', 'commissions_read'
        ],
        level: 5
      },
      {
        name: 'Buyer',
        description: 'Customer access',
        permissions: [
          'colony_read', 'colonies_read',
          'plot_read', 'plots_read',
          'booking_read', 'bookings_read'
        ],
        level: 1
      },
      {
        name: 'Lawyer',
        description: 'Legal documentation access',
        permissions: [
          'colony_read', 'colonies_read',
          'plot_read', 'plots_read',
          'booking_read', 'bookings_read',
          'registry_read', 'registry_create', 'registry_update', 'registries_read', 'registries_create'
        ],
        level: 6
      },
      {
        name: 'Colony Manager',
        description: 'Colony and plot management access',
        permissions: [
          'plot_read', 'plot_create', 'plot_update', 'plot_delete', 'plots_read', 'plots_create',
          'colony_read', 'colonies_read',
          'booking_read', 'bookings_read'
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

// Initialize admin user and sample users
const initUsers = async () => {
  try {
    console.log('Initializing users...');
    
    const adminRole = await Role.findOne({ name: 'Admin' });
    const managerRole = await Role.findOne({ name: 'Manager' });
    const agentRole = await Role.findOne({ name: 'Agent' });
    const buyerRole = await Role.findOne({ name: 'Buyer' });
    const lawyerRole = await Role.findOne({ name: 'Lawyer' });
    
    if (!adminRole) {
      console.error('Admin role not found');
      return;
    }

    const users = [
      {
        name: 'System Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@jayshree.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        phone: '+91 9876543210',
        role: adminRole._id,
        address: {
          street: 'Jayshri Group Office',
          city: 'Agra',
          state: 'Uttar Pradesh',
          pincode: '282001'
        }
      },
      {
        name: 'Rajesh Kumar',
        email: 'manager@jayshree.com',
        password: 'manager123',
        phone: '+91 9876543211',
        role: managerRole._id,
        address: {
          street: 'Sanjay Place',
          city: 'Agra',
          state: 'Uttar Pradesh',
          pincode: '282002'
        }
      },
      {
        name: 'Priya Sharma',
        email: 'agent@jayshree.com',
        password: 'agent123',
        phone: '+91 9876543212',
        role: agentRole._id,
        address: {
          street: 'MG Road',
          city: 'Agra',
          state: 'Uttar Pradesh',
          pincode: '282003'
        }
      },
      {
        name: 'Amit Verma',
        email: 'buyer@example.com',
        password: 'buyer123',
        phone: '+91 9876543213',
        role: buyerRole._id,
        address: {
          street: 'Fatehabad Road',
          city: 'Agra',
          state: 'Uttar Pradesh',
          pincode: '282004'
        }
      },
      {
        name: 'Advocate Suresh Gupta',
        email: 'lawyer@example.com',
        password: 'lawyer123',
        phone: '+91 9876543214',
        role: lawyerRole._id,
        address: {
          street: 'Civil Lines',
          city: 'Agra',
          state: 'Uttar Pradesh',
          pincode: '282005'
        }
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = await User.create(userData);
        console.log(`✅ Created user: ${user.name} (${user.email})`);
      } else {
        console.log(`⏭️  User already exists: ${userData.email}`);
      }
    }
  } catch (error) {
    console.error('Error initializing users:', error);
  }
};

// Initialize sample cities
const initCities = async () => {
  try {
    console.log('Initializing sample cities...');
    
    const cities = [
      { name: 'Agra', state: 'Uttar Pradesh', country: 'India' },
      { name: 'Mathura', state: 'Uttar Pradesh', country: 'India' },
      { name: 'Firozabad', state: 'Uttar Pradesh', country: 'India' },
      { name: 'Etawah', state: 'Uttar Pradesh', country: 'India' },
      { name: 'Mainpuri', state: 'Uttar Pradesh', country: 'India' }
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
    await initUsers();
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
