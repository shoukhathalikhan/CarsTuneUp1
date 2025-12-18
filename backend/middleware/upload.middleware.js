const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'carstuneup/others';
    let transformation = [{ width: 1000, height: 1000, crop: 'limit' }];
    
    if (file.fieldname === 'profileImage') {
      folder = 'carstuneup/profiles';
    } else if (file.fieldname === 'serviceImage') {
      folder = 'carstuneup/services';
    } else if (file.fieldname === 'beforePhotos' || file.fieldname === 'afterPhotos') {
      folder = 'carstuneup/jobs';
    } else if (file.fieldname === 'image') {
      folder = 'carstuneup/models';
      transformation = [{ width: 400, height: 300, crop: 'fit' }]; // Smaller, appropriate transformation for models
    }
    
    return {
      folder: folder,
      allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
      transformation: transformation
    };
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: fileFilter
});

module.exports = upload;
