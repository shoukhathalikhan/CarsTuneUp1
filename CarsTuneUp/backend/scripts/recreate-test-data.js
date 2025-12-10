const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');

mongoose.connect('mongodb://localhost:27017/carstuneup')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Create BMW brand with models as seen in the logs
      const bmwBrand = await Brand.create({
        name: 'BMW',
        logo: 'https://res.cloudinary.com/dcpaa0vub/image/upload/v1763660209/brands/lvflnk9xs7jxr0runl3e.png',
        isActive: true,
        models: [
          {
            name: 'asdjhfkhasdf',
            image: '', // Will be updated when image is uploaded
            isActive: true,
            pricePercentage: 0
          },
          {
            name: 'Brezza',
            image: '', // Will be updated when image is uploaded
            isActive: true,
            pricePercentage: 0
          }
        ]
      });
      
      console.log('BMW brand created successfully');
      console.log('Models:', bmwBrand.models);
      
      // Create a few more brands for testing
      const brands = [
        {
          name: 'Maruti suzuki',
          logo: 'https://res.cloudinary.com/dcpaa0vub/image/upload/v1762844261/brands/wbctxsqazpnaubhqwker.jpg',
          isActive: true,
          models: [{ name: 'Swift', image: '', isActive: true, pricePercentage: 0 }]
        },
        {
          name: 'Toyota',
          logo: 'https://res.cloudinary.com/dcpaa0vub/image/upload/v1763660142/brands/gsjfltbdpcz2hrhn18mo.png',
          isActive: true,
          models: [{ name: 'Camry', image: '', isActive: true, pricePercentage: 0 }]
        }
      ];
      
      for (const brandData of brands) {
        const brand = await Brand.create(brandData);
        console.log(`Created ${brand.name} with ${brand.models.length} models`);
      }
      
      console.log('\nTest data created successfully!');
      
    } catch (error) {
      console.error('Error creating test data:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
