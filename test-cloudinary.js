const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary Configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set ✓' : 'Missing ✗');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set ✓' : 'Missing ✗');
console.log('---');

// Test API connection
cloudinary.api.ping()
    .then(result => {
        console.log('✅ Cloudinary Connection Successful!');
        console.log('Response:', result);
        console.log('---');
        console.log('Cloudinary is properly configured and ready to use.');
    })
    .catch(error => {
        console.error('❌ Cloudinary Connection Failed!');
        console.error('Error:', error.message);
        console.error('---');
        console.error('Please check your Cloudinary credentials in .env file');
        console.error('Make sure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are correct');
    });
