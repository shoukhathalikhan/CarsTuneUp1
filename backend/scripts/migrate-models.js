const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function migrateModels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('Connected to MongoDB');

    // Get all brands
    const brands = await Brand.find({});
    console.log(`Found ${brands.length} brands`);

    let updatedCount = 0;

    for (const brand of brands) {
      let hasChanges = false;
      
      // Convert string models to object models
      const updatedModels = brand.models.map(model => {
        if (typeof model === 'string') {
          hasChanges = true;
          return {
            name: model,
            image: '', // Empty string for now, will be updated when images are uploaded
            isActive: true,
            pricePercentage: 0
          };
        }
        return model;
      });

      if (hasChanges) {
        brand.models = updatedModels;
        await brand.save();
        updatedCount++;
        console.log(`Updated brand: ${brand.name}`);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} brands.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateModels();
