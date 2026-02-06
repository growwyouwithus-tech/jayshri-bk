/**
 * Database Initialization Script
 * Sets up indexes, optimizations, and production-ready configurations
 */

require('dotenv').config()
const mongoose = require('mongoose')
const { indexing } = require('./utils/databaseOptimization')

// Enhanced database connection with optimizations
const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...')

    // Connect to MongoDB with optimized settings
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0,
      // Connection pool settings
      maxPoolSize: 50, // Maximum number of connections in the pool
      minPoolSize: 10, // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Maximum time a connection can be idle
      // Read preferences for better performance
      readPreference: 'primaryPreferred',
      // Write concern for data consistency
      w: 'majority',
      wtimeoutMS: 5000,
      journal: true
    })

    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`)
    console.log(`📊 Database: ${conn.connection.db.databaseName}`)
    console.log(`🔧 Connection state: ${conn.connection.readyState}`)

    // Create indexes for optimal performance
    console.log('📈 Creating database indexes...')
    await indexing.createIndexes()

    // Verify indexes were created
    console.log('🔍 Verifying indexes...')
    const { plotIndexes, colonyIndexes } = await indexing.checkIndexes()
    
    console.log(`📊 Plot collection: ${plotIndexes.length} indexes created`)
    console.log(`📊 Colony collection: ${colonyIndexes.length} indexes created`)

    // Test query performance
    console.log('⚡ Testing query performance...')
    await testQueryPerformance()

    console.log('✅ Database initialization completed successfully!')
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Test query performance with sample data
const testQueryPerformance = async () => {
  try {
    const Plot = require('./models/Plot')
    const Colony = require('./models/Colony')

    // Test 1: Basic plot query
    console.log('🧪 Test 1: Basic plot query')
    const start1 = Date.now()
    const plots = await Plot.find({ status: 'available' })
      .populate('colony', 'name city')
      .limit(10)
      .lean()
    const time1 = Date.now() - start1
    console.log(`   ✅ Found ${plots.length} plots in ${time1}ms`)

    // Test 2: Complex aggregation query
    console.log('🧪 Test 2: Plot statistics aggregation')
    const start2 = Date.now()
    const stats = await Plot.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgPrice: { $avg: '$totalPrice' },
          minPrice: { $min: '$totalPrice' },
          maxPrice: { $max: '$totalPrice' }
        }
      }
    ])
    const time2 = Date.now() - start2
    console.log(`   ✅ Aggregation completed in ${time2}ms`)
    console.log(`   📊 Results:`, stats)

    // Test 3: Text search (if available)
    console.log('🧪 Test 3: Text search query')
    const start3 = Date.now()
    const searchResults = await Colony.find({
      $text: { $search: 'jaipur' }
    }).limit(5)
    const time3 = Date.now() - start3
    console.log(`   ✅ Text search completed in ${time3}ms, found ${searchResults.length} results`)

    // Test 4: Geospatial query (if coordinates exist)
    console.log('🧪 Test 4: Geospatial query')
    const start4 = Date.now()
    const geoResults = await Plot.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [75.0, 26.0] // Jaipur coordinates
          },
          $maxDistance: 10000 // 10km radius
        }
      }
    }).limit(5)
    const time4 = Date.now() - start4
    console.log(`   ✅ Geospatial query completed in ${time4}ms, found ${geoResults.length} results`)

    console.log('✅ All performance tests completed successfully!')
    
  } catch (error) {
    console.warn('⚠️ Some performance tests failed (this is normal if data is missing):', error.message)
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database setup completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error)
      process.exit(1)
    })
}

module.exports = { initializeDatabase }