const mongoose = require('mongoose');
const Job = require('./models/Job.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Updating test job with actual photos...');
  
  try {
    // Update the test job with actual photo paths
    const result = await Job.updateOne(
      { _id: '69257af9e8c5cec82ca3f090' },
      {
        $set: {
          beforePhotos: ['/uploads/job-photos/beforePhoto-1764063619415-950235803.jpg'],
          afterPhotos: ['/uploads/job-photos/afterPhoto-1764063699147-946362638.jpg']
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Test job updated with actual photos!');
      
      // Verify the update
      const job = await Job.findById('69257af9e8c5cec82ca3f090')
        .populate('customerId', 'name email')
        .populate('serviceId', 'name');
      
      console.log(`   Job ID: ${job._id}`);
      console.log(`   Customer: ${job.customerId?.name}`);
      console.log(`   Service: ${job.serviceId?.name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Before Photos: ${job.beforePhotos?.length || 0}`);
      console.log(`   After Photos: ${job.afterPhotos?.length || 0}`);
      console.log(`   Photo URLs:`);
      job.beforePhotos?.forEach(photo => console.log(`     - http://192.168.1.125:5000${photo}`));
      job.afterPhotos?.forEach(photo => console.log(`     - http://192.168.1.125:5000${photo}`));
      
    } else {
      console.log('❌ No job found to update or no changes made');
    }
    
  } catch (error) {
    console.error('❌ Error updating test job:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
