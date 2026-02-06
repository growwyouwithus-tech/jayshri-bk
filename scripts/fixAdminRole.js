require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');

async function fixAdminRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find Admin role
    const adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      console.log('❌ Admin role not found!');
      process.exit(1);
    }

    console.log(`✅ Found Admin role: ${adminRole._id}\n`);

    // Find users without role or with invalid role reference
    const allUsers = await User.find().populate('role');
    const usersWithoutRole = allUsers.filter(u => !u.role || !u.role.name);

    console.log(`📊 Users without role: ${usersWithoutRole.length}\n`);

    if (usersWithoutRole.length === 0) {
      console.log('✅ All users have roles!');
      process.exit(0);
    }

    // Fix admin@jayshree.com specifically
    const adminUser = await User.findOne({ email: 'admin@jayshree.com' });
    if (adminUser) {
      adminUser.role = adminRole._id;
      await adminUser.save();
      console.log(`✅ Fixed: admin@jayshree.com → Admin role`);
    }

    // Fix other users without role (assign Admin role)
    for (const user of usersWithoutRole) {
      if (user.email !== 'admin@jayshree.com') {
        user.role = adminRole._id;
        await user.save();
        console.log(`✅ Fixed: ${user.email} → Admin role`);
      }
    }

    console.log('\n✅ All users fixed!');
    
    // Verify
    const verifiedUsers = await User.find().populate('role');
    console.log('\n📊 Verification:');
    verifiedUsers.forEach(user => {
      console.log(`   ${user.email} → ${user.role?.name || 'NO ROLE'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminRole();
