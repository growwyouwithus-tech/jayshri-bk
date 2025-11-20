require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');

const checkDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Roles
    console.log('=== ROLES IN DATABASE ===\n');
    const roles = await Role.find().lean();
    roles.forEach(r => {
      console.log(`📋 Role: ${r.name}`);
      console.log(`   Permissions: ${JSON.stringify(r.permissions)}`);
      console.log(`   Level: ${r.level}`);
      console.log(`   Active: ${r.isActive}`);
      console.log('');
    });

    // Check Users
    console.log('\n=== USERS IN DATABASE ===\n');
    const users = await User.find().populate('role').lean();
    users.forEach(u => {
      console.log(`👤 User: ${u.name} (${u.email})`);
      console.log(`   Role: ${u.role?.name || 'No role'}`);
      console.log(`   Role Permissions: ${JSON.stringify(u.role?.permissions || [])}`);
      console.log(`   Active: ${u.isActive}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkDatabase();
