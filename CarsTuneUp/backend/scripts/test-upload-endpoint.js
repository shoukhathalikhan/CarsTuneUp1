const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function testUploadEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('Connected to MongoDB');

    // Find Maruti Suzuki brand
    const marutiBrand = await Brand.findOne({ name: 'Maruti suzuki' });
    
    if (!marutiBrand) {
      console.log('Maruti Suzuki brand not found');
      process.exit(0);
    }

    console.log('Testing upload functionality...');
    console.log('Brand ID:', marutiBrand._id);
    console.log('Fronx model ID:', marutiBrand.models.find(m => m.name === 'Fronx')?._id);

    // Test the model update endpoint manually
    console.log('\nTo test the upload endpoint:');
    console.log('1. Go to admin dashboard');
    console.log('2. Edit Maruti Suzuki brand');
    console.log('3. Edit Fronx model');
    console.log('4. Upload an image');
    console.log('5. Check the browser console for errors');
    console.log('6. Check backend console for upload logs');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUploadEndpoint();
