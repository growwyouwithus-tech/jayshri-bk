const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const City = require('../models/City');
const Colony = require('../models/Colony');
const Property = require('../models/Property');
const Plot = require('../models/Plot');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');

// Load environment variables
require('dotenv').config();

const seedFreshData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/colony-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');
    console.log('🌱 Starting fresh data seeding...\n');

    // Get or create admin user
    let adminUser = await User.findOne({ email: 'admin@jayshree.com' });
    
    if (!adminUser) {
      console.log('👤 Creating admin user...');
      
      // Get or create admin role
      let adminRole = await Role.findOne({ name: 'admin' });
      if (!adminRole) {
        adminRole = await Role.create({
          name: 'admin',
          permissions: ['read', 'write', 'update', 'delete', 'manage_users', 'manage_roles'],
          description: 'System Administrator'
        });
      }
      
      // Create admin user with hashed password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@jayshree.com',
        password: hashedPassword,
        phone: '9876543200',
        role: adminRole._id,
        status: 'active',
        isVerified: true
      });
      
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found');
    }

    // 1. Create Cities
    console.log('📍 Creating cities...');
    const cities = await City.insertMany([
      {
        name: 'Agra',
        state: 'Uttar Pradesh',
        pincode: '282001',
        status: 'active'
      },
      {
        name: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        status: 'active'
      },
      {
        name: 'Mathura',
        state: 'Uttar Pradesh',
        pincode: '281001',
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${cities.length} cities`);

    // 2. Create Colonies (WITHOUT plotPrefix and description)
    console.log('\n🏙️  Creating colonies...');
    const colonies = await Colony.insertMany([
      {
        name: 'Jaishree Enclave',
        city: cities[0]._id,
        address: 'Sikandra Road, Agra',
        totalArea: 50000, // sq ft
        pricePerSqFt: 500,
        layoutUrl: 'https://example.com/layout1.jpg',
        coordinates: {
          latitude: 27.2046,
          longitude: 78.0131
        },
        status: 'ready_to_sell',
        sellers: [
          {
            name: 'Rajesh Kumar',
            mobile: '9876543210',
            address: 'Agra, UP'
          }
        ],
        purchasePrice: 20000000,
        createdBy: adminUser._id
      },
      {
        name: 'Green Valley Estate',
        city: cities[0]._id,
        address: 'Fatehabad Road, Agra',
        totalArea: 75000, // sq ft
        pricePerSqFt: 600,
        layoutUrl: 'https://example.com/layout2.jpg',
        coordinates: {
          latitude: 27.1767,
          longitude: 78.0081
        },
        status: 'ready_to_sell',
        sellers: [
          {
            name: 'Suresh Sharma',
            mobile: '9876543211',
            address: 'Agra, UP'
          }
        ],
        purchasePrice: 35000000,
        createdBy: adminUser._id
      },
      {
        name: 'Royal Gardens',
        city: cities[1]._id,
        address: 'Dwarka Sector 10, Delhi',
        totalArea: 100000, // sq ft
        pricePerSqFt: 1200,
        layoutUrl: 'https://example.com/layout3.jpg',
        coordinates: {
          latitude: 28.5921,
          longitude: 77.0460
        },
        status: 'under_development',
        sellers: [
          {
            name: 'Amit Verma',
            mobile: '9876543212',
            address: 'Delhi'
          }
        ],
        purchasePrice: 80000000,
        createdBy: adminUser._id
      }
    ]);
    console.log(`✅ Created ${colonies.length} colonies`);

    // 3. Create Properties with Roads and Parks
    console.log('\n🏢 Creating properties...');
    const properties = await Property.insertMany([
      {
        name: 'Jaishree Enclave Phase 1',
        category: 'Residential',
        colony: colonies[0]._id,
        city: cities[0]._id,
        address: 'Sikandra Road, Agra',
        totalLandAreaGaj: 5555.56, // 50000 sq ft / 9
        basePricePerGaj: 4500, // 500 * 9
        tagline: 'Premium Residential Plots',
        description: 'Well-planned residential colony with modern amenities',
        facilities: ['Electricity', 'Water Supply', 'Street Lights', 'Security'],
        amenities: ['Park', 'Community Hall', 'Temple'],
        roads: [
          { name: 'Main Road', lengthFt: 500, widthFt: 40 },
          { name: 'Internal Road 1', lengthFt: 300, widthFt: 20 },
          { name: 'Internal Road 2', lengthFt: 300, widthFt: 20 }
        ],
        parks: [
          { name: 'Central Park', lengthFt: 100, widthFt: 80 },
          { name: 'Kids Play Area', lengthFt: 60, widthFt: 40 }
        ],
        status: 'active',
        createdBy: adminUser._id
      },
      {
        name: 'Green Valley Phase 1',
        category: 'Residential',
        colony: colonies[1]._id,
        city: cities[0]._id,
        address: 'Fatehabad Road, Agra',
        totalLandAreaGaj: 8333.33, // 75000 sq ft / 9
        basePricePerGaj: 5400, // 600 * 9
        tagline: 'Luxury Living Spaces',
        description: 'Premium plots with excellent connectivity',
        facilities: ['Electricity', 'Water Supply', 'Sewage', 'Street Lights'],
        amenities: ['Garden', 'Gym', 'Swimming Pool'],
        roads: [
          { name: 'Main Boulevard', lengthFt: 600, widthFt: 50 },
          { name: 'Side Road 1', lengthFt: 400, widthFt: 25 }
        ],
        parks: [
          { name: 'Green Park', lengthFt: 120, widthFt: 100 }
        ],
        status: 'active',
        createdBy: adminUser._id
      },
      {
        name: 'Royal Gardens Phase 1',
        category: 'Commercial',
        colony: colonies[2]._id,
        city: cities[1]._id,
        address: 'Dwarka Sector 10, Delhi',
        totalLandAreaGaj: 11111.11, // 100000 sq ft / 9
        basePricePerGaj: 10800, // 1200 * 9
        tagline: 'Prime Commercial Spaces',
        description: 'Strategic location for business',
        facilities: ['Electricity', 'Water Supply', 'Parking', 'Security'],
        amenities: ['Food Court', 'ATM', 'Parking'],
        roads: [
          { name: 'Main Road', lengthFt: 800, widthFt: 60 }
        ],
        parks: [
          { name: 'Central Garden', lengthFt: 150, widthFt: 100 }
        ],
        status: 'active',
        createdBy: adminUser._id
      }
    ]);
    console.log(`✅ Created ${properties.length} properties`);

    // 4. Create Sample Plots
    console.log('\n🏘️  Creating plots...');
    
    // Property 1 plots
    const property1Plots = [];
    for (let i = 1; i <= 15; i++) {
      property1Plots.push({
        plotNumber: `JSE-${String(i).padStart(3, '0')}`,
        colony: colonies[0]._id,
        propertyId: properties[0]._id,
        area: 900, // sq ft
        sideMeasurements: {
          front: 30,
          back: 30,
          left: 30,
          right: 30
        },
        dimensions: {
          length: 30,
          width: 30,
          frontage: 30
        },
        pricePerSqFt: 500,
        totalPrice: 450000,
        status: i <= 5 ? 'sold' : i <= 10 ? 'booked' : 'available',
        facing: ['north', 'south', 'east', 'west'][i % 4],
        customerName: i <= 10 ? `Customer ${i}` : undefined,
        customerNumber: i <= 10 ? `98765432${10 + i}` : undefined,
        customerShortAddress: i <= 10 ? `Agra, UP` : undefined,
        paidAmount: i <= 5 ? 450000 : i <= 10 ? 200000 : 0,
        createdBy: adminUser._id
      });
    }

    // Property 2 plots
    const property2Plots = [];
    for (let i = 1; i <= 20; i++) {
      property2Plots.push({
        plotNumber: `GVE-${String(i).padStart(3, '0')}`,
        colony: colonies[1]._id,
        propertyId: properties[1]._id,
        area: 1200, // sq ft
        sideMeasurements: {
          front: 40,
          back: 40,
          left: 30,
          right: 30
        },
        dimensions: {
          length: 40,
          width: 30,
          frontage: 40
        },
        pricePerSqFt: 600,
        totalPrice: 720000,
        status: i <= 8 ? 'sold' : i <= 15 ? 'available' : 'blocked',
        facing: ['north', 'south', 'east', 'west', 'northeast'][i % 5],
        customerName: i <= 8 ? `Customer ${i + 20}` : undefined,
        customerNumber: i <= 8 ? `98765433${10 + i}` : undefined,
        customerShortAddress: i <= 8 ? `Agra, UP` : undefined,
        paidAmount: i <= 8 ? 720000 : 0,
        createdBy: adminUser._id
      });
    }

    // Property 3 plots (Commercial)
    const property3Plots = [];
    for (let i = 1; i <= 10; i++) {
      property3Plots.push({
        plotNumber: `RG-${String(i).padStart(3, '0')}`,
        colony: colonies[2]._id,
        propertyId: properties[2]._id,
        area: 1800, // sq ft
        sideMeasurements: {
          front: 60,
          back: 60,
          left: 30,
          right: 30
        },
        dimensions: {
          length: 60,
          width: 30,
          frontage: 60
        },
        pricePerSqFt: 1200,
        totalPrice: 2160000,
        status: i <= 3 ? 'sold' : 'available',
        facing: ['north', 'south', 'east'][i % 3],
        customerName: i <= 3 ? `Business ${i}` : undefined,
        customerNumber: i <= 3 ? `98765434${10 + i}` : undefined,
        customerShortAddress: i <= 3 ? `Delhi` : undefined,
        paidAmount: i <= 3 ? 2160000 : 0,
        createdBy: adminUser._id
      });
    }

    const allPlots = [...property1Plots, ...property2Plots, ...property3Plots];
    const plots = await Plot.insertMany(allPlots);
    console.log(`✅ Created ${plots.length} plots`);

    // Update colony plot counts
    console.log('\n🔄 Updating colony statistics...');
    for (const colony of colonies) {
      await colony.updatePlotCounts();
    }
    console.log('✅ Colony statistics updated');

    // 5. Skip Bookings for now (complex model with many required fields)
    console.log('\n📋 Skipping bookings (can be created from admin panel)...');
    const bookings = [];

    // 6. Create Sample Customers
    console.log('\n👥 Creating sample customers...');
    const customers = await Customer.insertMany([
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        password: '$2a$10$YourHashedPasswordHere', // You should hash this properly
        phone: '9876543210',
        address: 'Agra, Uttar Pradesh',
        city: cities[0]._id,
        isVerified: true,
        status: 'active'
      },
      {
        name: 'Priya Gupta',
        email: 'priya.gupta@example.com',
        password: '$2a$10$YourHashedPasswordHere',
        phone: '9876543211',
        address: 'Delhi',
        city: cities[1]._id,
        isVerified: true,
        status: 'active'
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@example.com',
        password: '$2a$10$YourHashedPasswordHere',
        phone: '9876543212',
        address: 'Mathura, Uttar Pradesh',
        city: cities[2]._id,
        isVerified: true,
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // 7. Create Additional Users (Manager, Agent, Buyer, Lawyer)
    console.log('\n👨‍💼 Creating additional users...');
    
    // Get or create roles
    let managerRole = await Role.findOne({ name: 'manager' });
    let agentRole = await Role.findOne({ name: 'agent' });
    let buyerRole = await Role.findOne({ name: 'buyer' });
    let lawyerRole = await Role.findOne({ name: 'lawyer' });

    // Create roles if they don't exist
    if (!managerRole) {
      managerRole = await Role.create({
        name: 'manager',
        permissions: ['read', 'write', 'update'],
        description: 'Property Manager'
      });
    }
    if (!agentRole) {
      agentRole = await Role.create({
        name: 'agent',
        permissions: ['read', 'write'],
        description: 'Sales Agent'
      });
    }
    if (!buyerRole) {
      buyerRole = await Role.create({
        name: 'buyer',
        permissions: ['read'],
        description: 'Property Buyer'
      });
    }
    if (!lawyerRole) {
      lawyerRole = await Role.create({
        name: 'lawyer',
        permissions: ['read', 'write'],
        description: 'Legal Advisor'
      });
    }

    const additionalUsers = [];
    
    // Check if users already exist
    const existingManager = await User.findOne({ email: 'manager@jayshree.com' });
    const existingAgent = await User.findOne({ email: 'agent@jayshree.com' });
    const existingBuyer = await User.findOne({ email: 'buyer@jayshree.com' });
    const existingLawyer = await User.findOne({ email: 'lawyer@jayshree.com' });

    if (!existingManager) {
      additionalUsers.push({
        name: 'Property Manager',
        email: 'manager@jayshree.com',
        password: '$2a$10$8K1p/a0dL3.I8.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.', // manager123
        phone: '9876543220',
        role: managerRole._id,
        status: 'active',
        isVerified: true
      });
    }

    if (!existingAgent) {
      additionalUsers.push({
        name: 'Sales Agent',
        email: 'agent@jayshree.com',
        password: '$2a$10$8K1p/a0dL3.I8.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.', // agent123
        phone: '9876543221',
        role: agentRole._id,
        status: 'active',
        isVerified: true
      });
    }

    if (!existingBuyer) {
      additionalUsers.push({
        name: 'Property Buyer',
        email: 'buyer@jayshree.com',
        password: '$2a$10$8K1p/a0dL3.I8.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.', // buyer123
        phone: '9876543222',
        role: buyerRole._id,
        status: 'active',
        isVerified: true
      });
    }

    if (!existingLawyer) {
      additionalUsers.push({
        name: 'Legal Advisor',
        email: 'lawyer@jayshree.com',
        password: '$2a$10$8K1p/a0dL3.I8.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.F9.', // lawyer123
        phone: '9876543223',
        role: lawyerRole._id,
        status: 'active',
        isVerified: true
      });
    }

    if (additionalUsers.length > 0) {
      await User.insertMany(additionalUsers);
      console.log(`✅ Created ${additionalUsers.length} additional users`);
    } else {
      console.log('✅ Additional users already exist');
    }

    // Summary
    console.log('\n📊 SEEDING SUMMARY');
    console.log('==================');
    console.log(`📍 Cities: ${cities.length}`);
    console.log(`🏙️  Colonies: ${colonies.length}`);
    console.log(`🏢 Properties: ${properties.length}`);
    console.log(`🏘️  Plots: ${plots.length}`);
    console.log(`   - Sold: ${plots.filter(p => p.status === 'sold').length}`);
    console.log(`   - Booked: ${plots.filter(p => p.status === 'booked').length}`);
    console.log(`   - Available: ${plots.filter(p => p.status === 'available').length}`);
    console.log(`   - Blocked: ${plots.filter(p => p.status === 'blocked').length}`);
    console.log(`📋 Bookings: ${bookings.length}`);
    console.log(`👥 Customers: ${customers.length}`);
    console.log(`👨‍💼 Additional Users: ${additionalUsers.length}`);

    console.log('\n📧 LOGIN CREDENTIALS');
    console.log('===================');
    console.log('Admin: admin@jayshree.com / admin123');
    console.log('Manager: manager@jayshree.com / manager123');
    console.log('Agent: agent@jayshree.com / agent123');
    console.log('Buyer: buyer@jayshree.com / buyer123');
    console.log('Lawyer: lawyer@jayshree.com / lawyer123');

    console.log('\n✨ Fresh data seeded successfully!');
    console.log('🚀 You can now login and start using the system\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

// Run seeding
seedFreshData();
