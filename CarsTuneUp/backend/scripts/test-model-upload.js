const mongoose = require('mongoose');
const Brand = require('../models/Brand.model');
const multer = require('multer');
const path = require('path');

// Import the upload middleware
const upload = require('../middleware/upload.middleware');

mongoose.connect('mongodb://localhost:27017/carstuneup')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find BMW brand
      const bmw = await Brand.findOne({ name: 'BMW' });
      if (!bmw) {
        console.log('BMW brand not found');
        return;
      }
      
      console.log('Found BMW brand with models:', bmw.models.map(m => m.name));
      
      // Test updating a model with a sample image URL
      const brezzaModel = bmw.models.id('692404d978ee91d22816913c');
      if (brezzaModel) {
        // Set a test image URL (using a known working image)
        brezzaModel.image = 'https://res.cloudinary.com/dcpaa0vub/image/upload/v1763660209/brands/lvflnk9xs7jxr0runl3e.png';
        await bmw.save();
        
        console.log('Updated Brezza model with test image');
        console.log('Image URL:', brezzaModel.image);
      }
      
      // Check the updated model
      const updatedBmw = await Brand.findOne({ name: 'BMW' });
      const updatedModel = updatedBmw.models.id('692404d978ee91d22816913c');
      console.log('Updated model image:', updatedModel.image);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
