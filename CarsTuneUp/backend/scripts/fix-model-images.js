const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function fixModelImages() {
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
      console.log('Current models:', brand.models);
      
      // Check if any models are strings (old format)
      const hasStringModels = brand.models.some(model => typeof model === 'string');
      
      if (hasStringModels) {
        console.log('Converting string models to objects...');
        
        // Convert string models to object models
        const updatedModels = brand.models.map(model => {
          if (typeof model === 'string') {
            return {
              name: model,
              image: '', // Empty string for now
              isActive: true,
              pricePercentage: 0
            };
          }
          return model;
        });

        brand.models = updatedModels;
        await brand.save();
        updatedCount++;
        console.log(`✅ Updated brand: ${brand.name}`);
        console.log('New models:', brand.models);
      } else {
        console.log('Models are already in object format');
      }
    }

    console.log(`\n✅ Migration completed. Updated ${updatedCount} brands.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

fixModelImages();
