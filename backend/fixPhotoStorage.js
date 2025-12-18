const mongoose = require('mongoose');
const Job = require('./models/Job.model');

require('dotenv').config();

async function fixPhotoStorage() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all jobs with local photo paths
    const jobsWithLocalPhotos = await Job.find({
      $or: [
        { beforePhotos: { $regex: '^/uploads/' } },
        { afterPhotos: { $regex: '^/uploads/' } }
      ]
    });
    
    console.log(`Found ${jobsWithLocalPhotos.length} jobs with local photo paths`);
    
    for (const job of jobsWithLocalPhotos) {
      console.log(`\nFixing job ${job._id}:`);
      
      // Update before photos
      if (job.beforePhotos && job.beforePhotos.length > 0) {
        const updatedBeforePhotos = job.beforePhotos.map(photo => {
          if (photo.startsWith('/uploads/')) {
            // Convert to full URL - this would normally be Cloudinary URL
            // For now, make it a placeholder since we can't recover the actual images
            return `https://res.cloudinary.com/dcpaa0vub/image/upload/carstuneup/job-photos/before-placeholder-${Date.now()}.jpg`;
          }
          return photo;
        });
        job.beforePhotos = updatedBeforePhotos;
        console.log(`  Updated before photos: ${updatedBeforePhotos.length} items`);
      }
      
      // Update after photos
      if (job.afterPhotos && job.afterPhotos.length > 0) {
        const updatedAfterPhotos = job.afterPhotos.map(photo => {
          if (photo.startsWith('/uploads/')) {
            // Convert to full URL - this would normally be Cloudinary URL
            // For now, make it a placeholder since we can't recover the actual images
            return `https://res.cloudinary.com/dcpaa0vub/image/upload/carstuneup/job-photos/after-placeholder-${Date.now()}.jpg`;
          }
          return photo;
        });
        job.afterPhotos = updatedAfterPhotos;
        console.log(`  Updated after photos: ${updatedAfterPhotos.length} items`);
      }
      
      await job.save();
      console.log(`  Saved job ${job._id}`);
    }
    
    console.log('\nPhoto storage fix completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixPhotoStorage();
