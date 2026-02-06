require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./models/Property');

async function fixImages() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Update JAYSHRI RESIDENCY property with existing image
    console.log('🔄 Updating property images...');
    const result = await Property.findOneAndUpdate(
      { name: 'JAYSHRI RESIDENCY FACE 1' },
      {
        $set: {
          'media.mainPicture': '/uploads/properties/1764404645044-75945454.png',
          'media.moreImages': [
            '/uploads/properties/1764404645056-259488477.png',
            '/uploads/properties/1764321229403-587208378.png'
          ]
        }
      },
      { new: true }
    );
    
    if (result) {
      console.log('✅ Updated property:', result.name);
      console.log('📸 Main Picture:', result.media.mainPicture);
      console.log('🖼️  More Images:', result.media.moreImages);
      console.log('\n✨ Success! Now refresh the user app to see images.');
    } else {
      console.log('❌ Property not found');
    }
    
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixImages();
