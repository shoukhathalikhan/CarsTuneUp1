const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Restoring real employee photos...');
  
  try {
    // Find the customer's job
    const customer = await User.findOne({ email: 'shoukhat2003@gmail.com' });
    const job = await Job.findOne({ 
      customerId: customer._id, 
      status: 'completed'
    });
    
    if (!job) {
      console.log('❌ No completed job found for customer');
      return;
    }
    
    console.log(`📋 Found job: ${job._id}`);
    console.log(`   Current before photos: ${job.beforePhotos.length}`);
    console.log(`   Current after photos: ${job.afterPhotos.length}`);
    console.log('   Current photos:');
    job.beforePhotos.forEach((photo, i) => console.log(`     Before ${i+1}: ${photo}`));
    job.afterPhotos.forEach((photo, i) => console.log(`     After ${i+1}: ${photo}`));
    
    // Restore the real employee-uploaded photos
    const realBeforePhotos = [
      'http://192.168.1.125:5000/uploads/job-photos/beforePhoto-1764063619415-950235803.jpg',
      'http://192.168.1.125:5000/uploads/job-photos/beforePhoto-1764063699147-946362638.jpg'
    ];
    
    const realAfterPhotos = [
      'http://192.168.1.125:5000/uploads/job-photos/afterPhoto-1764063637634-201526182.jpg',
      'http://192.168.1.125:5000/uploads/job-photos/afterPhoto-1764063720683-686670712.jpg'
    ];
    
    console.log('\n🔄 Restoring real photos...');
    console.log('   Real before photos:');
    realBeforePhotos.forEach((photo, i) => console.log(`     Before ${i+1}: ${photo}`));
    console.log('   Real after photos:');
    realAfterPhotos.forEach((photo, i) => console.log(`     After ${i+1}: ${photo}`));
    
    // Update the job with real photos
    await Job.findByIdAndUpdate(job._id, {
      beforePhotos: realBeforePhotos,
      afterPhotos: realAfterPhotos
    });
    
    console.log('\n✅ Real photos restored!');
    
    // Verify the restoration
    const updatedJob = await Job.findById(job._id);
    console.log(`   Updated before photos: ${updatedJob.beforePhotos.length}`);
    console.log(`   Updated after photos: ${updatedJob.afterPhotos.length}`);
    console.log(`   Will display on home page: ${updatedJob.beforePhotos.length > 0 && updatedJob.afterPhotos.length > 0 ? 'YES ✅' : 'NO ❌'}`);
    
    // Check if photo files actually exist
    const fs = require('fs');
    console.log('\n📁 Checking if photo files exist:');
    
    [...realBeforePhotos, ...realAfterPhotos].forEach(photoUrl => {
      const filePath = photoUrl.replace('http://192.168.1.125:5000/', '');
      const fullPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const actualPath = `./${fullPath}`;
      
      try {
        if (fs.existsSync(actualPath)) {
          console.log(`   ✅ ${photoUrl} - File exists`);
        } else {
          console.log(`   ❌ ${photoUrl} - File NOT found at ${actualPath}`);
        }
      } catch (error) {
        console.log(`   ❌ ${photoUrl} - Error checking file: ${error.message}`);
      }
    });
    
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
