require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    const email = 'jayshri@gmail.com';
    const password = 'admin10@';

    console.log(`🔐 Testing login for: ${email}`);
    console.log(`🔑 Password: ${password}\n`);

    // Find user
    const user = await User.findOne({ email }).populate('role').select('+password');
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log(`✅ User found: ${user.name}`);
    console.log(`   Role: ${user.role?.name || 'No Role'}`);
    console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
    console.log(`   Has Password: ${user.password ? '✅' : '❌'}`);
    console.log(`   Password Length: ${user.password?.length || 0}\n`);

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User is not active!');
      process.exit(1);
    }

    // Test password
    console.log('🔍 Testing password...');
    const isPasswordValid = await user.comparePassword(password);
    
    if (isPasswordValid) {
      console.log('✅ Password is CORRECT!');
      console.log('\n🎉 Login should work!');
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('\n💡 Need to reset password...');
      
      // Reset password
      user.password = password;
      await user.save();
      console.log('✅ Password reset to: admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testLogin();
