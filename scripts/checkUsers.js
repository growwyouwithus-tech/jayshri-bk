require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    const users = await User.find().populate('role');
    
    console.log(`📊 Total Users: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('Run: npm run init-db\n');
    } else {
      console.log('Users in database:');
      users.forEach(user => {
        console.log(`\n👤 ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role?.name || 'No Role'}`);
        console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
        console.log(`   Code: ${user.userCode || 'N/A'}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
