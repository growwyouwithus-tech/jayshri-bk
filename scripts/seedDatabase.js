const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Role = require('../models/Role');
const User = require('../models/User');
const City = require('../models/City');
const Colony = require('../models/Colony');
const Plot = require('../models/Plot');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Seed sample data
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('\n🌱 Starting sample data seeding...\n');

    // Get admin user and cities
    const adminUser = await User.findOne({ email: 'admin@jayshree.com' });
    if (!adminUser) {
      console.error('❌ Admin user not found. Run init-db first.');
      process.exit(1);
    }

    const cities = await City.find();
    if (cities.length === 0) {
      console.error('❌ No cities found. Run init-db first.');
      process.exit(1);
    }

    const mumbai = await City.findOne({ name: 'Mumbai' });
    const pune = await City.findOne({ name: 'Pune' });

    // Create sample colonies
    const colonies = [
      {
        name: 'Sunset Heights',
        description: 'Luxury residential colony with world-class amenities',
        city: mumbai._id,
        address: 'Sector 15, Mumbai',
        totalArea: 50,
        pricePerSqFt: 75000,
        amenities: [
          { name: 'Swimming Pool', description: 'Olympic size pool' },
          { name: 'Gym', description: 'Fully equipped fitness center' },
          { name: 'Garden', description: 'Landscaped gardens' },
        ],
        images: ['https://via.placeholder.com/400x300?text=Sunset+Heights'],
        coordinates: { latitude: 19.0760, longitude: 72.8777 },
        status: 'active',
        createdBy: adminUser._id,
      },
      {
        name: 'Green Paradise',
        description: 'Eco-friendly residential development',
        city: pune._id,
        address: 'Sector 8, Pune',
        totalArea: 75,
        pricePerSqFt: 65000,
        amenities: [
          { name: 'Green Belt', description: 'Large green areas' },
          { name: 'Community Center', description: 'Event management' },
          { name: 'Playground', description: 'Kids play area' },
        ],
        images: ['https://via.placeholder.com/400x300?text=Green+Paradise'],
        coordinates: { latitude: 18.5204, longitude: 73.8567 },
        status: 'active',
        createdBy: adminUser._id,
      },
      {
        name: 'Royal Estate',
        description: 'Premium villa community',
        city: mumbai._id,
        address: 'Sector 22, Mumbai',
        totalArea: 100,
        pricePerSqFt: 85000,
        amenities: [
          { name: 'Golf Course', description: '18 hole golf course' },
          { name: 'Club House', description: 'Premium club house' },
          { name: 'Concierge', description: '24/7 concierge service' },
        ],
        images: ['https://via.placeholder.com/400x300?text=Royal+Estate'],
        coordinates: { latitude: 19.1136, longitude: 72.8697 },
        status: 'active',
        createdBy: adminUser._id,
      },
    ];

    // Insert colonies
    const insertedColonies = [];
    for (const colonyData of colonies) {
      const existingColony = await Colony.findOne({ name: colonyData.name });
      if (!existingColony) {
        const colony = await Colony.create(colonyData);
        insertedColonies.push(colony);
        console.log(`✅ Created colony: ${colony.name}`);
      } else {
        insertedColonies.push(existingColony);
        console.log(`⏭️  Colony already exists: ${existingColony.name}`);
      }
    }

    // Create sample plots for each colony
    let plotCount = 0;
    for (const colony of insertedColonies) {
      // Delete existing plots for this colony first
      await Plot.deleteMany({ colony: colony._id });
      
      for (let i = 1; i <= 20; i++) {
        const plot = await Plot.create({
          plotNumber: `PLOT-${i}`,
          colony: colony._id,
          area: Math.floor(Math.random() * 500) + 100, // 100-600 sq ft
          dimensions: {
            length: Math.floor(Math.random() * 30) + 20,
            width: Math.floor(Math.random() * 30) + 20,
          },
          pricePerSqFt: colony.pricePerSqFt,
          totalPrice: 0, // Will be calculated by the schema
          status: ['available', 'blocked', 'reserved'][Math.floor(Math.random() * 3)],
          corner: Math.random() > 0.7,
          facing: ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)],
          roadWidth: Math.floor(Math.random() * 50) + 20,
          features: ['Corner Plot', 'Road Facing', 'Main Road Access'].filter(() => Math.random() > 0.5),
          nearbyAmenities: [
            { name: 'School', distance: Math.floor(Math.random() * 2) + 0.5 },
            { name: 'Hospital', distance: Math.floor(Math.random() * 3) + 1 },
          ],
          createdBy: adminUser._id,
        });
        plotCount++;
      }
      console.log(`✅ Created 20 plots for ${colony.name}`);
    }

    console.log(`\n✅ Created ${plotCount} sample plots`);
    console.log('\n🌱 Database seeding completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
