require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = require('../models/Role');
const User = require('../models/User');

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    const email = 'admin@jayshree.com';
    const newPassword = 'admin123';

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log(`✅ User found: ${user.name}`);
    console.log(`   Email: ${user.email}\n`);

    // Hash password manually
    console.log('🔐 Hashing new password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password directly without triggering pre-save hook
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    console.log('✅ Password updated successfully!\n');

    // Verify
    const updatedUser = await User.findOne({ email }).select('+password');
    const isValid = await bcrypt.compare(newPassword, updatedUser.password);
    
    if (isValid) {
      console.log('✅ Password verification: SUCCESS');
      console.log('\n🎉 You can now login with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log('❌ Password verification: FAILED');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetAdminPassword();
