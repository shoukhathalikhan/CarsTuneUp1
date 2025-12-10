const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
const Service = require('./models/Service.model');
const Subscription = require('./models/Subscription.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Debugging photo display issue...');
  
  try {
    // Find the customer who's logged in
    const customer = await User.findOne({ email: 'shoukhat2003@gmail.com' });
    
    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }
    
    console.log(`👤 Customer: ${customer.name} (${customer.email})`);
    console.log(`   ID: ${customer._id}`);
    
    // Find all jobs for this customer
    const jobs = await Job.find({ customerId: customer._id })
      .populate('serviceId', 'name')
      .populate('subscriptionId', 'status')
      .lean();
    
    console.log(`\n📋 Found ${jobs.length} jobs for this customer:`);
    console.log('═══════════════════════════════════════════');
    
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job._id}`);
      console.log(`   Service: ${job.serviceId?.name || 'N/A'}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Subscription: ${job.subscriptionId?._id || 'N/A'} (${job.subscriptionId?.status || 'N/A'})`);
      console.log(`   Before Photos: ${job.beforePhotos?.length || 0}`);
      console.log(`   After Photos: ${job.afterPhotos?.length || 0}`);
      
      if (job.beforePhotos?.length > 0) {
        console.log(`   Before Photo URLs:`);
        job.beforePhotos.forEach((photo, i) => {
          console.log(`     ${i + 1}. ${photo}`);
        });
      }
      
      if (job.afterPhotos?.length > 0) {
        console.log(`   After Photo URLs:`);
        job.afterPhotos.forEach((photo, i) => {
          console.log(`     ${i + 1}. ${photo}`);
        });
      }
      
      console.log('   ─────────────────────────────────────');
    });
    
    // Check which jobs should be displayed
    const jobsWithPhotos = jobs.filter(job => 
      (job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && 
      job.status === 'completed'
    );
    
    console.log(`\n📸 Jobs that should be displayed (completed with photos): ${jobsWithPhotos.length}`);
    jobsWithPhotos.forEach((job, index) => {
      console.log(`${index + 1}. ${job.serviceId?.name || 'Service'} - Before: ${job.beforePhotos?.length || 0}, After: ${job.afterPhotos?.length || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Debug complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
