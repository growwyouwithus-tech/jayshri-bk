const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Plot = require('./models/Plot');
const Role = require('./models/Role');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Check Lawyer User
    const lawyerRole = await Role.findOne({ name: 'Lawyer' });
    if (!lawyerRole) {
      console.log('❌ Lawyer role not found');
    } else {
      const lawyer = await User.findOne({ role: lawyerRole._id });
      if (lawyer) {
        console.log('👤 Lawyer User Found:', {
          name: lawyer.name,
          email: lawyer.email,
          userCode: lawyer.userCode,
          id: lawyer._id
        });

        // 2. Check Plots for this Lawyer
        if (lawyer.userCode) {
          const plots = await Plot.find({ advocateCode: lawyer.userCode.trim() });
          console.log(`📊 Plots found for advocate code "${lawyer.userCode}":`, plots.length);
          if (plots.length > 0) {
            console.log('Sample Plot:', {
              number: plots[0].plotNumber,
              customer: plots[0].customerName,
              status: plots[0].status,
              registryStatus: plots[0].registryStatus
            });
          }
        }
      } else {
        console.log('❌ No Lawyer user found');
      }
    }

    // 3. Check All Plots status
    const plotStats = await Plot.aggregate([
      { $match: { status: { $in: ['sold', 'booked'] } } },
      { $group: { _id: '$registryStatus', count: { $sum: 1 } } }
    ]);
    console.log('📈 Overall Registry Stats (Sold/Booked Plots):', plotStats);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDB();
