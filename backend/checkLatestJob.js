const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
const Service = require('./models/Service.model');
const Subscription = require('./models/Subscription.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Checking latest completed jobs with photos...');
  
  try {
    // Find the customer who's logged in
    const customer = await User.findOne({ email: 'shoukhat2003@gmail.com' });
    
    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }
    
    console.log(`👤 Customer: ${customer.name} (${customer.email})`);
    console.log(`   ID: ${customer._id}`);
    
    // Find all completed jobs for this customer, sorted by completion date
    const jobs = await Job.find({ customerId: customer._id })
      .populate('serviceId', 'name')
      .populate('subscriptionId', 'status')
      .sort({ completedDate: -1 }) // Most recent first
      .limit(10); // Check last 10 jobs
    
    console.log(`\n📋 Found ${jobs.length} jobs for this customer (most recent first):`);
    console.log('═══════════════════════════════════════════');
    
    let latestCompletedWithPhotos = null;
    
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job._id}`);
      console.log(`   Service: ${job.serviceId?.name || 'N/A'}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Scheduled: ${job.scheduledDate ? new Date(job.scheduledDate).toLocaleString() : 'N/A'}`);
      console.log(`   Completed: ${job.completedDate ? new Date(job.completedDate).toLocaleString() : 'N/A'}`);
      console.log(`   Before Photos: ${job.beforePhotos?.length || 0}`);
      console.log(`   After Photos: ${job.afterPhotos?.length || 0}`);
      
      if (job.beforePhotos?.length > 0) {
        console.log(`   Before Photo URLs:`);
        job.beforePhotos.forEach((photo, i) => {
          console.log(`     ${i + 1}. ${photo}`);
          // Check if file exists
          const fs = require('fs');
          const filePath = photo.replace('http://192.168.1.125:5000/', '');
          const actualPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
          const fullPath = `./${actualPath}`;
          try {
            if (fs.existsSync(fullPath)) {
              console.log(`        ✅ File exists`);
            } else {
              console.log(`        ❌ File NOT found at ${fullPath}`);
            }
          } catch (error) {
            console.log(`        ❌ Error checking file: ${error.message}`);
          }
        });
      }
      
      if (job.afterPhotos?.length > 0) {
        console.log(`   After Photo URLs:`);
        job.afterPhotos.forEach((photo, i) => {
          console.log(`     ${i + 1}. ${photo}`);
          // Check if file exists
          const fs = require('fs');
          const filePath = photo.replace('http://192.168.1.125:5000/', '');
          const actualPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
          const fullPath = `./${actualPath}`;
          try {
            if (fs.existsSync(fullPath)) {
              console.log(`        ✅ File exists`);
            } else {
              console.log(`        ❌ File NOT found at ${fullPath}`);
            }
          } catch (error) {
            console.log(`        ❌ Error checking file: ${error.message}`);
          }
        });
      }
      
      // Check if this job should be displayed
      const shouldDisplay = (job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && job.status === 'completed';
      console.log(`   Should display on home page: ${shouldDisplay ? 'YES ✅' : 'NO ❌'}`);
      
      if (shouldDisplay && !latestCompletedWithPhotos) {
        latestCompletedWithPhotos = job;
      }
      
      console.log('   ─────────────────────────────────────');
    });
    
    // Check the latest job that should display
    if (latestCompletedWithPhotos) {
      console.log(`\n🎯 Latest job that should display:`);
      console.log(`   Job ID: ${latestCompletedWithPhotos._id}`);
      console.log(`   Service: ${latestCompletedWithPhotos.serviceId?.name}`);
      console.log(`   Completed: ${new Date(latestCompletedWithPhotos.completedDate).toLocaleString()}`);
      console.log(`   Before Photos: ${latestCompletedWithPhotos.beforePhotos?.length || 0}`);
      console.log(`   After Photos: ${latestCompletedWithPhotos.afterPhotos?.length || 0}`);
    } else {
      console.log(`\n❌ No completed jobs with photos found for display`);
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
