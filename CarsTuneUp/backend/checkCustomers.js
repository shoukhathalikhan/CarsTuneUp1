const mongoose = require('mongoose');
const User = require('./models/User.model');
const Job = require('./models/Job.model');
const Service = require('./models/Service.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Checking customers and jobs...');
  
  try {
    // Find customers
    const customers = await User.find({ role: 'customer' });
    console.log(`\n👥 Found ${customers.length} customers:`);
    customers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.name} (${customer.email}) - ID: ${customer._id}`);
    });
    
    // Find jobs with photos
    const jobsWithPhotos = await Job.find({
      $or: [
        { beforePhotos: { $exists: true, $ne: [] } },
        { afterPhotos: { $exists: true, $ne: [] } }
      ]
    })
    .populate('customerId', 'name email')
    .populate('serviceId', 'name');
    
    console.log(`\n📸 Found ${jobsWithPhotos.length} jobs with photos:`);
    jobsWithPhotos.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job._id}`);
      console.log(`   Customer: ${job.customerId?.name || 'No customer'}`);
      console.log(`   Service: ${job.serviceId?.name || 'No service'}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Before Photos: ${job.beforePhotos?.length || 0}`);
      console.log(`   After Photos: ${job.afterPhotos?.length || 0}`);
      console.log(`   Customer ID: ${job.customerId}`);
      console.log('   ─────────────────────────────────────');
    });
    
    if (customers.length > 0 && jobsWithPhotos.length > 0) {
      console.log('\n✅ Both customers and jobs with photos exist');
      console.log('💡 If photos aren\'t showing, check:');
      console.log('   1. Customer authentication in app');
      console.log('   2. API response structure');
      console.log('   3. Job-customer relationship');
    } else if (customers.length === 0) {
      console.log('\n❌ No customers found - create a customer account first');
    } else if (jobsWithPhotos.length === 0) {
      console.log('\n❌ No jobs with photos found - create test jobs with photos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Check complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
