const mongoose = require('mongoose');
const Job = require('./models/Job.model');

require('dotenv').config();

async function checkPhotoUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find recent jobs with photos
    const recentJobs = await Job.find({
      status: 'completed',
      $or: [
        { beforePhotos: { $exists: true, $ne: [] } },
        { afterPhotos: { $exists: true, $ne: [] } }
      ]
    }).sort({ completedDate: -1 }).limit(3);
    
    console.log(`Checking ${recentJobs.length} recent jobs with photos:`);
    
    for (const job of recentJobs) {
      console.log(`\nJob ${job._id}:`);
      
      // Check before photos
      if (job.beforePhotos && job.beforePhotos.length > 0) {
        console.log(`  Before Photos (${job.beforePhotos.length}):`);
        job.beforePhotos.forEach((photo, i) => {
          console.log(`    ${i + 1}. ${photo}`);
          console.log(`       Type: ${typeof photo}`);
          console.log(`       Valid URL: ${photo.startsWith('http') ? 'Yes' : 'No'}`);
        });
      }
      
      // Check after photos
      if (job.afterPhotos && job.afterPhotos.length > 0) {
        console.log(`  After Photos (${job.afterPhotos.length}):`);
        job.afterPhotos.forEach((photo, i) => {
          console.log(`    ${i + 1}. ${photo}`);
          console.log(`       Type: ${typeof photo}`);
          console.log(`       Valid URL: ${photo.startsWith('http') ? 'Yes' : 'No'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkPhotoUrls();
