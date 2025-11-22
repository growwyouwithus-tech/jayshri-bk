const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Role = require('../models/Role');

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

// Generate user codes for existing users
const generateUserCodes = async () => {
  try {
    await connectDB();
    
    console.log('\n🔄 Generating user codes for existing users...\n');

    // Define prefixes based on role
    const prefixMap = {
      'Agent': 'AG',
      'Lawyer': 'ADV',
      'Manager': 'MGR',
      'Admin': 'ADM',
      'Buyer': 'BYR',
      'Colony Manager': 'CM'
    };

    // Get all users without userCode
    const users = await User.find({ userCode: { $exists: false } }).populate('role');
    
    console.log(`Found ${users.length} users without codes\n`);

    const counters = {};

    for (const user of users) {
      const roleName = user.role?.name;
      const prefix = prefixMap[roleName] || 'EMP';
      
      // Initialize counter for this prefix
      if (!counters[prefix]) {
        // Find the last user with this prefix
        const lastUser = await User.findOne({
          userCode: new RegExp(`^${prefix}-`)
        }).sort({ userCode: -1 });
        
        if (lastUser && lastUser.userCode) {
          const lastNumber = parseInt(lastUser.userCode.split('-')[1]);
          counters[prefix] = lastNumber + 1;
        } else {
          counters[prefix] = 1;
        }
      }
      
      // Generate code
      const userCode = `${prefix}-${String(counters[prefix]).padStart(5, '0')}`;
      
      // Update user
      user.userCode = userCode;
      await user.save({ validateBeforeSave: false });
      
      console.log(`✅ ${user.name} (${roleName}): ${userCode}`);
      
      // Increment counter
      counters[prefix]++;
    }

    console.log('\n✅ User codes generated successfully!\n');
    console.log('📝 Code Format:');
    console.log('- Agent: AG-00001, AG-00002, ...');
    console.log('- Lawyer/Advocate: ADV-00001, ADV-00002, ...');
    console.log('- Manager: MGR-00001, MGR-00002, ...');
    console.log('- Admin: ADM-00001, ADM-00002, ...');
    console.log('- Buyer: BYR-00001, BYR-00002, ...');
    console.log('- Colony Manager: CM-00001, CM-00002, ...');
    console.log('- Other: EMP-00001, EMP-00002, ...\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating user codes:', error);
    process.exit(1);
  }
};

// Run generation
generateUserCodes();
