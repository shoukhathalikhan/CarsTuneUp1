const cloudinary = require('../config/cloudinary');

/**
 * Delete photos from Cloudinary by their URLs
 * @param {Array} photoUrls - Array of Cloudinary photo URLs
 * @returns {Promise<Array>} Array of deletion results
 */
const deleteCloudinaryPhotos = async (photoUrls) => {
  const deletionResults = [];
  
  for (const photoUrl of photoUrls) {
    try {
      // Extract public_id from Cloudinary URL with folder support
      // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/subfolder/public_id.jpg
      const urlParts = photoUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        // Extract folder and public_id from the path after 'upload'
        const folderAndPublicId = urlParts.slice(uploadIndex + 2).join('/'); // Skip version and get folder/public_id
        const filenameWithExtension = folderAndPublicId.split('/').pop(); // Get last part (filename)
        const publicId = filenameWithExtension.split('.')[0]; // Remove extension
        
        // Include folder in public_id if it exists
        const folderPath = folderAndPublicId.split('/').slice(0, -1).join('/');
        const fullPublicId = folderPath ? `${folderPath}/${publicId}` : publicId;
        
        if (fullPublicId) {
          const result = await cloudinary.uploader.destroy(fullPublicId);
          deletionResults.push({
            url: photoUrl,
            publicId: fullPublicId,
            deleted: result.result === 'ok',
            result
          });
        } else {
          deletionResults.push({
            url: photoUrl,
            publicId: null,
            deleted: false,
            error: 'Could not extract public_id from URL'
          });
        }
      } else {
        deletionResults.push({
          url: photoUrl,
          publicId: null,
          deleted: false,
          error: 'Invalid Cloudinary URL format'
        });
      }
    } catch (error) {
      deletionResults.push({
        url: photoUrl,
        publicId: null,
        deleted: false,
        error: error.message
      });
    }
  }
  
  return deletionResults;
};

/**
 * Delete local photos from filesystem
 * @param {Array} photoPaths - Array of local file paths
 * @returns {Promise<Array>} Array of deletion results
 */
const deleteLocalPhotos = async (photoPaths) => {
  const fs = require('fs').promises;
  const path = require('path');
  const deletionResults = [];
  
  for (const photoPath of photoPaths) {
    try {
      // Convert URL path to filesystem path
      // Example: /uploads/job-photos/filename.jpg -> uploads/job-photos/filename.jpg
      const cleanPath = photoPath.replace(/^\//, '');
      const fullPath = path.join(process.cwd(), cleanPath);
      
      await fs.unlink(fullPath);
      deletionResults.push({
        path: photoPath,
        fullPath,
        deleted: true
      });
    } catch (error) {
      deletionResults.push({
        path: photoPath,
        fullPath: null,
        deleted: false,
        error: error.message
      });
    }
  }
  
  return deletionResults;
};

/**
 * Delete photos based on URL type (Cloudinary or local)
 * @param {Array} photoUrls - Array of photo URLs
 * @returns {Promise<Array>} Array of deletion results
 */
const deletePhotos = async (photoUrls) => {
  const results = [];
  
  for (const photoUrl of photoUrls) {
    if (photoUrl.includes('cloudinary.com')) {
      // Cloudinary photo
      const cloudinaryResults = await deleteCloudinaryPhotos([photoUrl]);
      results.push(...cloudinaryResults);
    } else if (photoUrl.includes('uploads/')) {
      // Local photo
      const localResults = await deleteLocalPhotos([photoUrl]);
      results.push(...localResults);
    } else {
      // Unknown photo type
      results.push({
        url: photoUrl,
        deleted: false,
        error: 'Unknown photo URL type'
      });
    }
  }
  
  return results;
};

module.exports = {
  deleteCloudinaryPhotos,
  deleteLocalPhotos,
  deletePhotos
};
