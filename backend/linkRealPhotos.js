const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Linking real employee photos to customer job...');
  
  try {
    // Find the customer's test job
    const customer = await User.findOne({ email: 'shoukhat2003@gmail.com' });
    const job = await Job.findOne({ 
      customerId: customer._id, 
      status: 'completed',
      beforePhotos: { $exists: true, $ne: [] }
    });
    
    if (!job) {
      console.log('❌ No completed job with photos found for customer');
      return;
    }
    
    console.log(`📋 Found job: ${job._id}`);
    console.log(`   Current before photos: ${job.beforePhotos.length}`);
    console.log(`   Current after photos: ${job.afterPhotos.length}`);
    
    // Update with real photo URLs (using local server URLs)
    const realBeforePhotos = [
      'http://192.168.1.125:5000/uploads/job-photos/beforePhoto-1764063619415-950235803.jpg',
      'http://192.168.1.125:5000/uploads/job-photos/beforePhoto-1764063699147-946362638.jpg'
    ];
    
    const realAfterPhotos = [
      'http://192.168.1.125:5000/uploads/job-photos/afterPhoto-1764063637634-201526182.jpg',
      'http://192.168.1.125:5000/uploads/job-photos/afterPhoto-1764063720683-686670712.jpg'
    ];
    
    // Update the job with real photos
    await Job.findByIdAndUpdate(job._id, {
      beforePhotos: realBeforePhotos,
      afterPhotos: realAfterPhotos
    });
    
    console.log('✅ Job updated with real employee photos!');
    console.log(`   Before Photos: ${realBeforePhotos.length}`);
    realBeforePhotos.forEach(photo => console.log(`     - ${photo}`));
    console.log(`   After Photos: ${realAfterPhotos.length}`);
    realAfterPhotos.forEach(photo => console.log(`     - ${photo}`));
    
    // Verify the update
    const updatedJob = await Job.findById(job._id);
    console.log(`\n📱 Updated job will display: ${updatedJob.beforePhotos.length > 0 && updatedJob.afterPhotos.length > 0 ? 'YES ✅' : 'NO ❌'}`);
    
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
