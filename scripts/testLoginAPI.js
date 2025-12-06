require('dotenv').config();
const mongoose = require('mongoose');

async function testLoginAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Test login data
    const loginData = {
      email: 'jayshri@gmail.com',
      password: 'admin10@'
    };

    console.log('🔐 Testing login API validation...');
    console.log(`📧 Email: ${loginData.email}`);
    console.log(`🔑 Password: ${loginData.password}`);
    console.log(`📏 Password length: ${loginData.password.length}`);
    console.log(`🔤 Contains letters: ${/[a-zA-Z]/.test(loginData.password)}`);
    console.log(`🔢 Contains numbers: ${/[0-9]/.test(loginData.password)}`);
    console.log(`🔣 Contains special chars: ${/[^a-zA-Z0-9]/.test(loginData.password)}`);
    console.log(`\n✅ Password validation should PASS (minimum 8 characters, any type allowed)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLoginAPI();
