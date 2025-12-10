const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
const Service = require('./models/Service.model');
const Subscription = require('./models/Subscription.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Checking jobs with photos...');
  
  const jobs = await Job.find({
    $or: [
      { beforePhotos: { $exists: true, $ne: [] } },
      { afterPhotos: { $exists: true, $ne: [] } }
    ]
  })
  .populate('customerId', 'name email')
  .populate('serviceId', 'name')
  .populate('subscriptionId')
  .lean();
  
  console.log('\n📋 Jobs with Photos:');
  console.log('═══════════════════════════════════════════');
  
  if (jobs.length === 0) {
    console.log('❌ No jobs found with photos');
    console.log('💡 Create a test job with photos first');
  } else {
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job._id}`);
      console.log(`   Customer: ${job.customerId?.name || 'N/A'}`);
      console.log(`   Service: ${job.serviceId?.name || 'N/A'}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Before Photos: ${job.beforePhotos?.length || 0}`);
      console.log(`   After Photos: ${job.afterPhotos?.length || 0}`);
      console.log(`   Subscription: ${job.subscriptionId?._id || 'N/A'}`);
      console.log('   ─────────────────────────────────────');
    });
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Check complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
