const mongoose = require('mongoose');
const Job = require('./models/Job.model');

require('dotenv').config();

async function cleanNullPhotos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find jobs with null photo values
    const jobsWithNullPhotos = await Job.find({
      $or: [
        { beforePhotos: null },
        { beforePhotos: { $elemMatch: { $eq: null } } },
        { afterPhotos: null },
        { afterPhotos: { $elemMatch: { $eq: null } } }
      ]
    });
    
    console.log(`Found ${jobsWithNullPhotos.length} jobs with null photo values`);
    
    for (const job of jobsWithNullPhotos) {
      console.log(`\nCleaning job ${job._id}:`);
      
      let updated = false;
      
      // Clean before photos
      if (job.beforePhotos && job.beforePhotos.includes(null)) {
        job.beforePhotos = job.beforePhotos.filter(photo => photo !== null && photo !== undefined);
        updated = true;
        console.log(`  Cleaned before photos, now: ${job.beforePhotos.length} items`);
      }
      
      // Clean after photos
      if (job.afterPhotos && job.afterPhotos.includes(null)) {
        job.afterPhotos = job.afterPhotos.filter(photo => photo !== null && photo !== undefined);
        updated = true;
        console.log(`  Cleaned after photos, now: ${job.afterPhotos.length} items`);
      }
      
      if (updated) {
        await job.save();
        console.log(`  Saved job ${job._id}`);
      }
    }
    
    console.log('\nNull photo cleanup completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanNullPhotos();
