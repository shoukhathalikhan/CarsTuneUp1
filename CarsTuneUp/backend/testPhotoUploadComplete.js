const mongoose = require('mongoose');
const Job = require('./models/Job.model');

require('dotenv').config();

async function testPhotoUploadComplete() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check recent jobs with photos
    const recentJobsWithPhotos = await Job.find({
      status: 'completed',
      $or: [
        { beforePhotos: { $exists: true, $ne: [] } },
        { afterPhotos: { $exists: true, $ne: [] } }
      ]
    }).sort({ completedDate: -1 }).limit(5);
    
    console.log(`Found ${recentJobsWithPhotos.length} recent completed jobs with photos:`);
    
    recentJobsWithPhotos.forEach((job, index) => {
      console.log(`\nJob ${index + 1}:`);
      console.log(`  ID: ${job._id}`);
      console.log(`  Customer: ${job.customerId}`);
      console.log(`  Service: ${job.serviceId}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Completed: ${job.completedDate}`);
      console.log(`  Before Photos: ${job.beforePhotos?.length || 0}`);
      console.log(`  After Photos: ${job.afterPhotos?.length || 0}`);
      
      if (job.beforePhotos?.length > 0) {
        console.log(`  Before URLs:`);
        job.beforePhotos.forEach((url, i) => {
          console.log(`    ${i + 1}. ${url}`);
        });
      }
      
      if (job.afterPhotos?.length > 0) {
        console.log(`  After URLs:`);
        job.afterPhotos.forEach((url, i) => {
          console.log(`    ${i + 1}. ${url}`);
        });
      }
    });
    
    // Test cleanup functionality
    console.log('\n\nTesting cleanup functionality...');
    const allCompletedJobs = await Job.find({
      customerId: '691055531d09932462925f79',
      status: 'completed'
    }).sort({ completedDate: -1 });
    
    console.log(`Customer has ${allCompletedJobs.length} total completed jobs`);
    
    if (allCompletedJobs.length > 3) {
      console.log('Jobs to be kept (latest 3):');
      allCompletedJobs.slice(0, 3).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job._id} - ${job.completedDate}`);
      });
      
      console.log('Jobs to be cleaned up:');
      allCompletedJobs.slice(3).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job._id} - ${job.completedDate}`);
      });
    } else {
      console.log('No cleanup needed - customer has 3 or fewer completed jobs');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPhotoUploadComplete();
