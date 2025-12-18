const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');

mongoose.connect('mongodb://localhost:27017/carstuneup')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all brands and format like the API would
      const brands = await Brand.find({ isActive: true });
      
      console.log('API Response Simulation:');
      console.log(JSON.stringify({
        status: 'success',
        results: brands.length,
        data: { 
          brands: brands.map(brand => ({
            _id: brand._id,
            name: brand.name,
            logo: brand.logo,
            isActive: brand.isActive,
            models: brand.models.filter(model => model.isActive !== false)
          }))
        }
      }, null, 2));
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
