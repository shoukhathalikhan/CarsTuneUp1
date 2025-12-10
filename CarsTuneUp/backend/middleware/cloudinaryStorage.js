const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure Cloudinary storage for job photos
const jobPhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'carstuneup/job-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    public_id: (req, file) => {
      const { jobId, photoType } = req.params;
      const timestamp = Date.now();
      return `${jobId}-${photoType}-${timestamp}`;
    },
    transformation: [
      { width: 800, height: 600, crop: 'limit' }, // Limit size while maintaining aspect ratio
      { quality: 'auto:good' } // Optimize quality
    ]
  },
});

// Configure Cloudinary storage for profile pictures
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'carstuneup/profile-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    public_id: (req, file) => {
      const userId = req.user?._id || 'unknown';
      const timestamp = Date.now();
      return `profile-${userId}-${timestamp}`;
    },
    transformation: [
      { width: 300, height: 300, crop: 'fill' }, // Square crop for profile
      { quality: 'auto:good' }
    ]
  },
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer upload configurations
const uploadJobPhoto = multer({
  storage: jobPhotoStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for profile photos
    files: 1
  }
});

module.exports = {
  uploadJobPhoto,
  uploadProfilePhoto,
  jobPhotoStorage,
  profilePhotoStorage
};
