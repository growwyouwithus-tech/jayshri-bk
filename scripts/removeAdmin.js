require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function removeAdmin() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');

    const adminEmail = 'jayshri@gmail.com';

    // Find and remove admin
    const admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('❌ Admin not found with email:', adminEmail);
      process.exit(1);
    }

    console.log(`✅ Admin found: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   User Code: ${admin.userCode}\n`);

    // Delete admin user
    await User.deleteOne({ email: adminEmail });
    
    console.log('✅ Admin user removed successfully!\n');
    console.log('⚠️  This action can only be performed by developers with database access.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

removeAdmin();
