require('dotenv').config();
const axios = require('axios');

async function testLoginValidation() {
  try {
    const API_URL = process.env.API_URL || 'http://localhost:5000/api/v1';
    
    console.log('🔐 Testing Login Validation...\n');
    console.log(`📡 API URL: ${API_URL}\n`);

    // Test with correct credentials
    const loginData = {
      email: 'jayshri@gmail.com',
      password: 'admin10@'
    };

    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password:', loginData.password);
    console.log('📏 Password length:', loginData.password.length);
    console.log('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      console.log('✅ Login Successful!');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Login Failed!');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Errors:', JSON.stringify(error.response?.data?.errors, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLoginValidation();
