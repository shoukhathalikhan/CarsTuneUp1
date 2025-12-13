const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Job = require('../models/Job.model');

// Configure Cloudinary storage for job photos
// Folder structure requirement:
// /CarsTuneUp/customerId/serviceId/before
// /CarsTuneUp/customerId/serviceId/after
const jobPhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const jobId = req.params.id || 'unknown';
    const stage = file.fieldname.toLowerCase().includes('before') ? 'before' : 'after';

    let customerId = 'unknownCustomer';
    let serviceId = 'unknownService';
    try {
      const job = await Job.findById(jobId).select('customerId serviceId');
      if (job?.customerId) customerId = job.customerId.toString();
      if (job?.serviceId) serviceId = job.serviceId.toString();
    } catch (_e) {
      // If job lookup fails, still upload to a safe fallback folder
    }

    return {
      folder: `CarsTuneUp/${customerId}/${serviceId}/${stage}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      public_id: `${jobId}-${stage}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      resource_type: 'image',
      format: 'auto'
    };
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

const uploadJobPhotos = multer({
  storage: jobPhotoStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
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
  uploadJobPhotos,
  uploadProfilePhoto,
  jobPhotoStorage,
  profilePhotoStorage
};
