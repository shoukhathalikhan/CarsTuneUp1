const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function addImagesToAllBrands() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('Connected to MongoDB');

    // Get all brands
    const brands = await Brand.find({});
    console.log(`Found ${brands.length} brands`);

    const testImages = [
      'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/car.jpg',
      'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/sedan.jpg',
      'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/suv.jpg',
      'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/truck.jpg',
      'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/van.jpg'
    ];

    let updatedCount = 0;

    for (const brand of brands) {
      let hasChanges = false;
      
      // Add images to all models in the brand
      brand.models.forEach((model, index) => {
        if (!model.image || model.image.trim() === '') {
          model.image = testImages[index % testImages.length];
          hasChanges = true;
          console.log(`✅ Added image to ${brand.name} - ${model.name}`);
        }
      });

      if (hasChanges) {
        await brand.save();
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} brands with test images`);
    
    // Verify Maruti Suzuki specifically
    const marutiBrand = await Brand.findOne({ name: 'Maruti suzuki' });
    if (marutiBrand) {
      console.log('\n=== Maruti Suzuki Models ===');
      marutiBrand.models.forEach(model => {
        console.log(`${model.name}: ${model.image}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addImagesToAllBrands();
