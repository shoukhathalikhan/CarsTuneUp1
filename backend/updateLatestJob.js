const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const Service = require('./models/Service.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Updating latest job with employee photos...');
  
  try {
    const jobId = '6912f29ef89c775734ee13b0';
    const photoBaseUrl = 'http://192.168.1.125:5000/uploads/job-photos/';
    
    // Latest photos uploaded by employee
    const latestBeforePhoto = photoBaseUrl + 'beforePhoto-1764065919360-682145462.jpg';
    const latestAfterPhoto = photoBaseUrl + 'afterPhoto-1764065940611-191883232.jpg';
    
    console.log(`📋 Updating Job ID: ${jobId}`);
    console.log(`   Before Photo: ${latestBeforePhoto}`);
    console.log(`   After Photo: ${latestAfterPhoto}`);
    
    // Update the job with the latest photos
    const updatedJob = await Job.findByIdAndUpdate(jobId, {
      beforePhotos: [latestBeforePhoto],
      afterPhotos: [latestAfterPhoto]
    }, { new: true }).populate('serviceId', 'name');
    
    if (!updatedJob) {
      console.log('❌ Job not found');
      return;
    }
    
    console.log('\n✅ Job updated successfully!');
    console.log(`   Service: ${updatedJob.serviceId?.name}`);
    console.log(`   Status: ${updatedJob.status}`);
    console.log(`   Completed: ${new Date(updatedJob.completedDate).toLocaleString()}`);
    console.log(`   Before Photos: ${updatedJob.beforePhotos.length}`);
    console.log(`   After Photos: ${updatedJob.afterPhotos.length}`);
    
    updatedJob.beforePhotos.forEach((photo, i) => {
      console.log(`     Before ${i+1}: ${photo}`);
    });
    
    updatedJob.afterPhotos.forEach((photo, i) => {
      console.log(`     After ${i+1}: ${photo}`);
    });
    
    // Check if files exist
    const fs = require('fs');
    console.log('\n📁 Checking if photo files exist:');
    
    [latestBeforePhoto, latestAfterPhoto].forEach(photoUrl => {
      const filePath = photoUrl.replace('http://192.168.1.125:5000/', '');
      const actualPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = `./${actualPath}`;
      
      try {
        if (fs.existsSync(fullPath)) {
          console.log(`   ✅ ${photoUrl} - File exists`);
        } else {
          console.log(`   ❌ ${photoUrl} - File NOT found at ${fullPath}`);
        }
      } catch (error) {
        console.log(`   ❌ ${photoUrl} - Error checking file: ${error.message}`);
      }
    });
    
    const shouldDisplay = updatedJob.beforePhotos.length > 0 && updatedJob.afterPhotos.length > 0;
    console.log(`\n📱 Will display on customer home page: ${shouldDisplay ? 'YES ✅' : 'NO ❌'}`);
    
    if (shouldDisplay) {
      console.log('\n💡 Customer should now see the latest photos on their home page!');
      console.log('   - The "Recent Work" section should appear above the insurance section');
      console.log('   - Before/after photos uploaded by the employee should be visible');
      console.log('   - Service: "Daily Sparkle"');
      console.log('   - Completed time: "3:49 PM today"');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
