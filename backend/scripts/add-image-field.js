const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function addImageField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('Connected to MongoDB');

    // Get all brands
    const brands = await Brand.find({});
    console.log(`Found ${brands.length} brands`);

    let updatedCount = 0;

    for (const brand of brands) {
      console.log(`\nChecking brand: ${brand.name}`);
      
      let hasChanges = false;
      const updatedModels = brand.models.map(model => {
        // Check if model has image field
        if (!model.hasOwnProperty('image') || model.image === undefined) {
          hasChanges = true;
          console.log(`Adding image field to model: ${model.name}`);
          return {
            ...model.toObject ? model.toObject() : model,
            image: '' // Add empty image field
          };
        }
        return model;
      });

      if (hasChanges) {
        brand.models = updatedModels;
        await brand.save();
        updatedCount++;
        console.log(`✅ Updated brand: ${brand.name}`);
      } else {
        console.log('Models already have image field');
      }
    }

    console.log(`\n✅ Migration completed. Updated ${updatedCount} brands.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addImageField();
