const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');

mongoose.connect('mongodb://localhost:27017/carstuneup')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find BMW brand and check models
      const bmw = await Brand.findOne({ name: 'BMW' });
      if (bmw) {
        console.log('BMW models:');
        bmw.models.forEach(model => {
          console.log('- Model:', model.name);
          console.log('  Image:', model.image || 'NO IMAGE');
          console.log('  Image length:', model.image ? model.image.length : 0);
          console.log('  Image type:', typeof model.image);
          console.log('---');
        });
      } else {
        console.log('BMW brand not found');
      }
      
      // Check all brands with models
      const brandsWithModels = await Brand.find({ 'models.0': { '$exists': true } });
      console.log('\nAll brands with models:');
      brandsWithModels.forEach(brand => {
        console.log(`Brand: ${brand.name}`);
        brand.models.forEach(model => {
          if (model.image) {
            console.log(`  - ${model.name}: ${model.image.substring(0, 100)}...`);
          } else {
            console.log(`  - ${model.name}: NO IMAGE`);
          }
        });
      });
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
