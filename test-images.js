const mongoose = require('mongoose');
require('dotenv').config();

const propertySchema = new mongoose.Schema({}, { strict: false });
const Property = mongoose.model('Property', propertySchema);

async function testImages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Fetching properties...');
    const properties = await Property.find({}).select('name media').lean();
    
    console.log(`\n📊 Total Properties: ${properties.length}\n`);
    
    properties.forEach((prop, index) => {
      console.log(`\n${index + 1}. Property: ${prop.name || 'Unnamed'}`);
      console.log(`   ID: ${prop._id}`);
      
      if (prop.media) {
        console.log('   📁 Media:');
        if (prop.media.mainPicture) {
          console.log(`      ✅ Main Picture: ${prop.media.mainPicture}`);
        } else {
          console.log('      ❌ Main Picture: Not set');
        }
        
        if (prop.media.videoUpload) {
          console.log(`      ✅ Video: ${prop.media.videoUpload}`);
        }
        
        if (prop.media.mapImage) {
          console.log(`      ✅ Map Image: ${prop.media.mapImage}`);
        }
        
        if (prop.media.moreImages && prop.media.moreImages.length > 0) {
          console.log(`      ✅ More Images: ${prop.media.moreImages.length} files`);
          prop.media.moreImages.forEach((img, i) => {
            console.log(`         ${i + 1}. ${img}`);
          });
        } else {
          console.log('      ❌ More Images: None');
        }
      } else {
        console.log('   ❌ No media field found');
      }
    });
    
    console.log('\n\n🔍 Summary:');
    const withMainPicture = properties.filter(p => p.media?.mainPicture).length;
    const withMoreImages = properties.filter(p => p.media?.moreImages?.length > 0).length;
    console.log(`   Properties with Main Picture: ${withMainPicture}/${properties.length}`);
    console.log(`   Properties with More Images: ${withMoreImages}/${properties.length}`);
    
    // Test if files exist
    console.log('\n\n📂 Checking if image files exist on disk...');
    const fs = require('fs');
    const path = require('path');
    
    let filesFound = 0;
    let filesMissing = 0;
    
    properties.forEach(prop => {
      if (prop.media?.mainPicture) {
        const filePath = path.join(__dirname, prop.media.mainPicture);
        if (fs.existsSync(filePath)) {
          filesFound++;
          console.log(`   ✅ Found: ${prop.media.mainPicture}`);
        } else {
          filesMissing++;
          console.log(`   ❌ Missing: ${prop.media.mainPicture}`);
        }
      }
      
      if (prop.media?.moreImages) {
        prop.media.moreImages.forEach(img => {
          const filePath = path.join(__dirname, img);
          if (fs.existsSync(filePath)) {
            filesFound++;
          } else {
            filesMissing++;
            console.log(`   ❌ Missing: ${img}`);
          }
        });
      }
    });
    
    console.log(`\n   Total files found: ${filesFound}`);
    console.log(`   Total files missing: ${filesMissing}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testImages();
