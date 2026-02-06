const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testPropertyUpload() {
  try {
    console.log('🔐 Step 1: Login to get token...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@jayshree.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received\n');
    
    console.log('🏘️ Step 2: Fetching colonies...');
    const coloniesResponse = await axios.get('http://localhost:5000/api/v1/colonies', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const colonies = coloniesResponse.data.data.colonies || coloniesResponse.data.data;
    if (colonies.length === 0) {
      console.log('❌ No colonies found. Please create a colony first.');
      return;
    }
    
    const firstColony = colonies[0];
    console.log(`✅ Found colony: ${firstColony.name} (ID: ${firstColony._id})\n`);
    
    console.log('📦 Step 3: Creating test property with images...');
    
    const formData = new FormData();
    
    // Add property data
    formData.append('name', 'Test Property with Images - ' + Date.now());
    formData.append('colonyId', firstColony._id);
    formData.append('categories', JSON.stringify(['Residential']));
    formData.append('tagline', 'Test Property Tagline');
    formData.append('description', 'This is a test property to verify image upload functionality');
    formData.append('facilities', JSON.stringify(['Parking', 'Security']));
    
    // Check if test image exists, if not create a simple one
    const testImagePath = path.join(__dirname, 'uploads', 'properties', '1764752211753-216236697.jpg');
    
    if (fs.existsSync(testImagePath)) {
      console.log('📸 Using existing image for testing...');
      formData.append('mainPicture', fs.createReadStream(testImagePath), {
        filename: 'test-main.jpg',
        contentType: 'image/jpeg'
      });
      
      formData.append('moreImages', fs.createReadStream(testImagePath), {
        filename: 'test-more-1.jpg',
        contentType: 'image/jpeg'
      });
    } else {
      console.log('⚠️ No test image found. Skipping image upload.');
    }
    
    console.log('🚀 Sending request to create property...\n');
    
    const response = await axios.post('http://localhost:5000/api/v1/properties', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Property created successfully!');
    console.log('📋 Property Details:');
    console.log(`   Name: ${response.data.data.property.name}`);
    console.log(`   ID: ${response.data.data.property._id}`);
    
    if (response.data.data.property.media) {
      console.log('\n🖼️ Media Information:');
      const media = response.data.data.property.media;
      
      if (media.mainPicture) {
        console.log(`   ✅ Main Picture: ${media.mainPicture}`);
        console.log(`      URL: http://localhost:5000${media.mainPicture}`);
      } else {
        console.log('   ❌ Main Picture: Not saved');
      }
      
      if (media.moreImages && media.moreImages.length > 0) {
        console.log(`   ✅ More Images: ${media.moreImages.length} file(s)`);
        media.moreImages.forEach((img, i) => {
          console.log(`      ${i + 1}. ${img}`);
          console.log(`         URL: http://localhost:5000${img}`);
        });
      } else {
        console.log('   ❌ More Images: Not saved');
      }
    } else {
      console.log('\n❌ No media field in response!');
    }
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Open User App: http://localhost:5174');
    console.log('   2. Check if property images are visible');
    console.log(`   3. Direct image URL: http://localhost:5000${response.data.data.property.media?.mainPicture || '/uploads/properties/...'}`);
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.message || error.response.data);
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testPropertyUpload();
