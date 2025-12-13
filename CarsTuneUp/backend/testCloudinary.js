const cloudinary = require('./config/cloudinary');

async function testCloudinaryUpload() {
  try {
    console.log('Testing Cloudinary configuration...');
    console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key exists:', !!process.env.CLOUDINARY_API_KEY);
    console.log('API Secret exists:', !!process.env.CLOUDINARY_API_SECRET);
    
    // Test with a base64 encoded simple image
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'carstuneup/test',
      public_id: `test-${Date.now()}`,
      resource_type: 'image'
    });
    
    console.log('Upload successful:', result);
    console.log('URL:', result.secure_url);
    
  } catch (error) {
    console.error('Cloudinary test failed:', error);
  }
}

testCloudinaryUpload();
