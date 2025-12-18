const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
const Service = require('./models/Service.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Updating test job with working photo URLs...');
  
  try {
    // Update the test job with working image URLs
    const job = await Job.findByIdAndUpdate(
      '692586490bbf30c2f7d8ba2e',
      {
        beforePhotos: [
          'https://picsum.photos/400/300?random=1&blur=2' // Blurry "before" car photo
        ],
        afterPhotos: [
          'https://picsum.photos/400/300?random=2' // Clean "after" car photo
        ]
      },
      { new: true }
    ).populate('customerId', 'name email')
     .populate('serviceId', 'name');
    
    if (!job) {
      console.log('❌ Test job not found');
      return;
    }
    
    console.log('✅ Test job updated with working photo URLs!');
    console.log(`   Job ID: ${job._id}`);
    console.log(`   Customer: ${job.customerId?.name}`);
    console.log(`   Service: ${job.serviceId?.name}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Before Photos: ${job.beforePhotos.length}`);
    console.log(`   After Photos: ${job.afterPhotos.length}`);
    console.log(`   Photo URLs:`);
    job.beforePhotos.forEach(photo => console.log(`     Before: ${photo}`));
    job.afterPhotos.forEach(photo => console.log(`     After: ${photo}`));
    
    // Verify it will be displayed
    const shouldDisplay = (job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && job.status === 'completed';
    console.log(`\n📱 Will display on home page: ${shouldDisplay ? 'YES ✅' : 'NO ❌'}`);
    
  } catch (error) {
    console.error('❌ Error updating job:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
