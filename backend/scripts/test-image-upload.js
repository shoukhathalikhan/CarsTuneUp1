const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testImageUpload() {
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

    console.log('Found Maruti Suzuki brand');

    // Add a test image URL to Brezza model
    const brezzaModel = marutiBrand.models.find(m => m.name === 'Brezza');
    
    if (brezzaModel) {
      // Use a sample image URL for testing
      brezzaModel.image = 'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/car.jpg';
      console.log('Updated Brezza with test image URL');
      
      await marutiBrand.save();
      console.log('✅ Test image added to Brezza model');
    } else {
      console.log('Brezza model not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testImageUpload();
