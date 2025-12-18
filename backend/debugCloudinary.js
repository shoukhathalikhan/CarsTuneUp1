const cloudinary = require('./config/cloudinary');

async function debugCloudinary() {
  try {
    console.log('Cloudinary config check:');
    console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key exists:', !!process.env.CLOUDINARY_API_KEY);
    console.log('API Secret exists:', !!process.env.CLOUDINARY_API_SECRET);
    
    // Test Cloudinary connection
    console.log('\nTesting Cloudinary connection...');
    const result = await cloudinary.api.ping();
    console.log('Cloudinary ping successful:', result);
    
    // Test upload with a simple buffer
    console.log('\nTesting upload...');
    const fs = require('fs');
    const path = require('path');
    
    // Find a test image
    const testImagePath = path.join(__dirname, '../customer-app/assets/White-Car-HD-Cart.jpg');
    if (fs.existsSync(testImagePath)) {
      const uploadResult = await cloudinary.uploader.upload(testImagePath, {
        folder: 'carstuneup/test',
        public_id: `debug-test-${Date.now()}`,
        resource_type: 'auto'
      });
      
      console.log('Upload successful:', uploadResult.secure_url);
      console.log('Public ID:', uploadResult.public_id);
    } else {
      console.log('Test image not found, skipping upload test');
    }
    
  } catch (error) {
    console.error('Cloudinary debug failed:', error);
    if (error.http_code) {
      console.error('HTTP Code:', error.http_code);
      console.error('Cloudinary error:', error.message);
    }
  }
}

debugCloudinary();
