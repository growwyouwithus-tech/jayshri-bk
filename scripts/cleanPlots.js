const mongoose = require('mongoose');
require('dotenv').config();

const mongoose_connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
    
    // Get the plots collection
    const db = mongoose.connection.db;
    const collection = db.collection('plots');
    
    // Drop all indexes except the primary _id
    await collection.dropIndexes();
    console.log('✅ Dropped all indexes from plots collection');
    
    // Delete all documents
    const result = await collection.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} documents from plots collection`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

mongoose_connect();
