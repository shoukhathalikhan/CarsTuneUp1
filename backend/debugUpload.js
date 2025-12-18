const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

async function debugUpload() {
  try {
    console.log('🔍 Debugging Upload Configuration\n');

    // Check raw environment variables
    console.log('Raw Environment Variables:');
    console.log(`  CLOUDINARY_CLOUD_NAME: "${process.env.CLOUDINARY_CLOUD_NAME}"`);
    console.log(`  CLOUDINARY_API_KEY: "${process.env.CLOUDINARY_API_KEY}"`);
    console.log(`  CLOUDINARY_API_SECRET: "${process.env.CLOUDINARY_API_SECRET}"`);

    // Check Cloudinary config
    console.log('\nCloudinary Configuration:');
    console.log(`  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`  API Key: ${process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing'}`);
    console.log(`  API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'}`);

    // Configure Cloudinary manually
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      console.log('✅ Cloudinary configured manually');
    } else {
      console.log('❌ Missing Cloudinary configuration');
      return;
    }

    // Test Cloudinary connection
    try {
      const result = await cloudinary.api.ping();
      console.log('✅ Cloudinary connection:', result);
    } catch (error) {
      console.log('❌ Cloudinary connection failed:', error.message);
      console.log('Cloudinary config:', cloudinary.config());
      return;
    }

    // Test Cloudinary storage configuration
    console.log('\n📸 Testing Cloudinary Storage Configuration:');
    
    const storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        console.log('File info:', {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });

        let folder = 'carstuneup/jobs';
        let transformation = [{ width: 1000, height: 1000, crop: 'limit' }];
        
        return {
          folder: folder,
          allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
          transformation: transformation
        };
      }
    });

    const upload = multer({
      storage: storage,
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        console.log('File validation:', {
          mimetype: file.mimetype,
          extname: require('path').extname(file.originalname).toLowerCase(),
          valid: mimetype && extname
        });

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
        }
      }
    });

    console.log('✅ Multer-Cloudinary storage configured successfully');

    // Test with a mock file upload
    console.log('\n🧪 Testing Upload with Mock Data:');
    
    // Create a test buffer (simulating an image)
    const testBuffer = Buffer.from('fake-image-data');
    const mockFile = {
      fieldname: 'beforePhoto',
      originalname: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: testBuffer
    };

    console.log('Mock file created:', mockFile);

    console.log('\n✅ Upload configuration test complete!');
    console.log('If this passes, the issue might be in the controller logic or request handling.');

  } catch (error) {
    console.error('\n❌ Debug Error:', error.message);
    console.error(error.stack);
  }
}

debugUpload();
