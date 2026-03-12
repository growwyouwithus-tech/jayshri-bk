const mongoose = require('mongoose');
require('dotenv').config();

const Plot = require('./models/Plot');

async function assignPlots() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all sold/booked plots
    const plots = await Plot.find({ status: { $in: ['sold', 'booked'] } }).limit(10);
    console.log(`🔍 Found ${plots.length} sold/booked plots to update`);

    if (plots.length > 0) {
      const ids = plots.map(p => p._id);
      const result = await Plot.updateMany(
        { _id: { $in: ids } },
        { 
          $set: { 
            advocateCode: 'ADV-00001',
            advocateName: 'demo_adv',
            registryStatus: 'pending' 
          } 
        }
      );
      console.log(`✅ Assigned plots to advocate code "ADV-00001". Modified: ${result.modifiedCount}`);
    } else {
      console.log('❌ No sold/booked plots found to assign');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

assignPlots();
