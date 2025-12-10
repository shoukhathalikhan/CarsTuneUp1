const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
require('dotenv').config();

async function addTestImages() {
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
    console.log('Current models:', marutiBrand.models.map(m => ({ name: m.name, image: m.image })));

    // Add test images to all models
    const testImages = [
      'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/car.jpg',
      'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/sedan.jpg',
      'https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/suv.jpg'
    ];

    marutiBrand.models.forEach((model, index) => {
      if (testImages[index]) {
        model.image = testImages[index];
        console.log(`✅ Added image to ${model.name}: ${testImages[index]}`);
      }
    });

    await marutiBrand.save();
    console.log('\n✅ All Maruti Suzuki models now have test images!');
    
    console.log('\nUpdated models:');
    marutiBrand.models.forEach(model => {
      console.log(`${model.name}: ${model.image}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestImages();
