const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function clearTestImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('Connected to MongoDB');

    // Get all brands
    const brands = await Brand.find({});
    console.log(`Found ${brands.length} brands`);

    let clearedCount = 0;

    for (const brand of brands) {
      let hasChanges = false;
      
      // Clear test images from all models
      brand.models.forEach((model) => {
        if (model.image && model.image.includes('res.cloudinary.com/demo')) {
          model.image = ''; // Clear test image
          hasChanges = true;
          console.log(`🗑️ Cleared test image from ${brand.name} - ${model.name}`);
        }
      });

      if (hasChanges) {
        await brand.save();
        clearedCount++;
      }
    }

    console.log(`\n✅ Cleared test images from ${clearedCount} brands`);
    console.log('Now you can upload your own images via the admin dashboard!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearTestImages();
