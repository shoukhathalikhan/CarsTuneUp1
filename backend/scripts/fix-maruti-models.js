const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function fixMarutiModels() {
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
    console.log('Current models:', JSON.stringify(marutiBrand.models, null, 2));

    // Fix each model to ensure they have image field
    const updatedModels = marutiBrand.models.map(model => {
      const modelObj = model.toObject ? model.toObject() : model;
      
      // Ensure image field exists
      if (!modelObj.hasOwnProperty('image') || modelObj.image === undefined) {
        console.log(`Adding image field to model: ${modelObj.name}`);
        return {
          ...modelObj,
          image: '' // Add empty image field
        };
      }
      
      return modelObj;
    });

    console.log('Updated models:', JSON.stringify(updatedModels, null, 2));

    // Save the updated brand
    marutiBrand.models = updatedModels;
    await marutiBrand.save();
    
    console.log('✅ Maruti Suzuki models updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMarutiModels();
