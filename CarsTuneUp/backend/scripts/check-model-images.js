const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function checkModelImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('Connected to MongoDB');

    // Get all brands
    const brands = await Brand.find({});
    console.log(`Found ${brands.length} brands`);

    let totalModels = 0;
    let modelsWithImages = 0;

    for (const brand of brands) {
      console.log(`\n=== ${brand.name} ===`);
      
      for (const model of brand.models) {
        totalModels++;
        const hasImage = model.image && model.image.trim() !== '' && model.image !== 'undefined';
        
        if (hasImage) {
          modelsWithImages++;
          console.log(`✅ ${model.name}: ${model.image}`);
        } else {
          console.log(`❌ ${model.name}: No image (${model.image})`);
        }
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total models: ${totalModels}`);
    console.log(`Models with images: ${modelsWithImages}`);
    console.log(`Models without images: ${totalModels - modelsWithImages}`);

    if (modelsWithImages === 0) {
      console.log('\n🔍 No models have images uploaded yet!');
      console.log('You need to upload images via the admin dashboard.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkModelImages();
