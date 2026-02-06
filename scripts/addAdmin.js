require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = require('../models/Role');
const User = require('../models/User');

async function addAdmin() {
  try {
    // Connect to database - try both possible env variables
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');

    const adminEmail = 'jayshri@gmail.com';
    const adminPassword = 'admin10@';
    const adminName = 'Admin';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin with this email already exists!');
      console.log('   Updating password...\n');
      
      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      await User.updateOne(
        { _id: existingAdmin._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('✅ Admin password updated successfully!\n');
    } else {
      // Find Admin role
      const adminRole = await Role.findOne({ name: 'Admin' });
      if (!adminRole) {
        console.log('❌ Admin role not found! Please run seedRoles.js first.');
        process.exit(1);
      }

      console.log(`✅ Admin role found: ${adminRole.name}\n`);

      // Create new admin user
      const newAdmin = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // Will be hashed by pre-save hook
        role: adminRole._id,
        isActive: true,
        permissions: ['all']
      });

      await newAdmin.save();
      console.log('✅ Admin user created successfully!\n');
    }

    // Verify admin user
    const adminUser = await User.findOne({ email: adminEmail }).populate('role');
    
    if (adminUser) {
      console.log('🎉 Admin Details:');
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role.name}`);
      console.log(`   User Code: ${adminUser.userCode}`);
      console.log(`   Active: ${adminUser.isActive}\n`);
      
      console.log('🔐 Login Credentials:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}\n`);
      
      console.log('✅ Admin has been added to the database!');
      console.log('   Only developers can remove/add admin users through database scripts.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addAdmin();
