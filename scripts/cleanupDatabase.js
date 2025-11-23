const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const City = require('../models/City');
const Colony = require('../models/Colony');
const Plot = require('../models/Plot');
const Property = require('../models/Property');
const Booking = require('../models/Booking');

// Load environment variables
require('dotenv').config();

const cleanupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/colony-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');
    console.log('🗑️  Starting database cleanup...\n');

    // Delete all data except users
    const bookingsDeleted = await Booking.deleteMany({});
    console.log(`📋 Deleted ${bookingsDeleted.deletedCount} bookings`);

    const plotsDeleted = await Plot.deleteMany({});
    console.log(`🏘️  Deleted ${plotsDeleted.deletedCount} plots`);

    const propertiesDeleted = await Property.deleteMany({});
    console.log(`🏢 Deleted ${propertiesDeleted.deletedCount} properties`);

    const coloniesDeleted = await Colony.deleteMany({});
    console.log(`🏙️  Deleted ${coloniesDeleted.deletedCount} colonies`);

    const citiesDeleted = await City.deleteMany({});
    console.log(`📍 Deleted ${citiesDeleted.deletedCount} cities`);

    // Keep users and roles
    const userCount = await User.countDocuments();
    const roleCount = await Role.countDocuments();
    console.log(`\n✅ Preserved ${userCount} users`);
    console.log(`✅ Preserved ${roleCount} roles`);

    console.log('\n✨ Database cleanup completed successfully!');
    console.log('📝 All data deleted except users and roles');
    console.log('🚀 You can now add fresh data according to updated logic\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Run cleanup
cleanupDatabase();
