const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function checkRealUploads() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('Connected to MongoDB');

    // Get all brands and check for real uploaded images
    const brands = await Brand.find({});
    console.log(`Found ${brands.length} brands`);

    let realUploads = 0;
    let testImages = 0;

    for (const brand of brands) {
      console.log(`\n=== ${brand.name} ===`);
      
      for (const model of brand.models) {
        const hasImage = model.image && model.image.trim() !== '';
        
        if (hasImage) {
          // Check if it's a real uploaded image (from your Cloudinary account)
          const isRealUpload = model.image.includes('dcpaa0vub'); // Your Cloudinary cloud name
          
          if (isRealUpload) {
            realUploads++;
            console.log(`✅ ${model.name}: REAL UPLOAD - ${model.image}`);
          } else {
            testImages++;
            console.log(`🧪 ${model.name}: TEST IMAGE - ${model.image}`);
          }
        } else {
          console.log(`❌ ${model.name}: No image`);
        }
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Real uploaded images: ${realUploads}`);
    console.log(`Test images: ${testImages}`);
    console.log(`Models without images: ${brands.reduce((sum, brand) => sum + brand.models.filter(m => !m.image || m.image.trim() === '').length, 0)}`);

    if (realUploads === 0) {
      console.log('\n🔍 No real uploaded images found!');
      console.log('You need to upload images via the admin dashboard.');
      console.log('\nTo upload images:');
      console.log('1. Go to admin dashboard → Brands');
      console.log('2. Click "Edit Model" on any model');
      console.log('3. Upload a car image');
      console.log('4. Click "Update Model"');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRealUploads();
