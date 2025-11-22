require('dotenv').config();
const mongoose = require('mongoose');
const City = require('../models/City');
const Colony = require('../models/Colony');
const Property = require('../models/Property');
const Plot = require('../models/Plot');

async function clearAndAddData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Clear existing data (except users and roles)
    console.log('🗑️ Clearing existing data...');
    await Plot.deleteMany({});
    await Property.deleteMany({});
    await Colony.deleteMany({});
    await City.deleteMany({});
    console.log('✅ Data cleared\n');

    console.log('📝 Now run: npm run add-dummy');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAndAddData();
