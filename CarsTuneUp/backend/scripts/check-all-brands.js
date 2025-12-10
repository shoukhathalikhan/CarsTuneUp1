const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');

mongoose.connect('mongodb://localhost:27017/carstuneup')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      const brands = await Brand.find({});
      console.log(`Found ${brands.length} brands:`);
      
      brands.forEach(brand => {
        console.log(`\nBrand: ${brand.name}`);
        console.log(`  Models: ${brand.models.length}`);
        
        if (brand.models.length > 0) {
          brand.models.forEach(model => {
            console.log(`    - ${model.name}`);
            console.log(`      Image: ${model.image || 'NO IMAGE'}`);
            if (model.image) {
              console.log(`      Image URL length: ${model.image.length}`);
              console.log(`      Image URL starts with: ${model.image.substring(0, 50)}...`);
            }
          });
        }
      });
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
