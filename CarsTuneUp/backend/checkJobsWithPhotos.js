const mongoose = require('mongoose');
const Job = require('./models/Job.model');

require('dotenv').config();

async function checkJobsWithPhotos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find jobs with photos (simplified query without populate)
    const jobsWithPhotos = await Job.find({
      $or: [
        { beforePhotos: { $exists: true, $ne: [] } },
        { afterPhotos: { $exists: true, $ne: [] } }
      ]
    });
    
    console.log(`Found ${jobsWithPhotos.length} jobs with photos:`);
    
    jobsWithPhotos.forEach((job, index) => {
      console.log(`\nJob ${index + 1}:`);
      console.log(`  ID: ${job._id}`);
      console.log(`  Customer ID: ${job.customerId}`);
      console.log(`  Service ID: ${job.serviceId}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Before Photos: ${job.beforePhotos?.length || 0}`);
      console.log(`  After Photos: ${job.afterPhotos?.length || 0}`);
      if (job.beforePhotos?.length > 0) {
        console.log(`  Before URLs: ${job.beforePhotos.slice(0, 2).join(', ')}${job.beforePhotos.length > 2 ? '...' : ''}`);
      }
      if (job.afterPhotos?.length > 0) {
        console.log(`  After URLs: ${job.afterPhotos.slice(0, 2).join(', ')}${job.afterPhotos.length > 2 ? '...' : ''}`);
      }
    });
    
    // Find completed jobs without photos
    const completedWithoutPhotos = await Job.find({
      status: 'completed',
      $and: [
        { $or: [{ beforePhotos: { $exists: false } }, { beforePhotos: [] }] },
        { $or: [{ afterPhotos: { $exists: false } }, { afterPhotos: [] }] }
      ]
    }).countDocuments();
    
    console.log(`\nCompleted jobs without photos: ${completedWithoutPhotos}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkJobsWithPhotos();
