const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
const Subscription = require('./models/Subscription.model');
const Service = require('./models/Service.model');
const Employee = require('./models/Employee.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Creating test job with Cloudinary photos...');
  
  try {
    // Find existing data
    const customer = await User.findOne({ role: 'customer', email: 'shoukhat2003@gmail.com' }); // Using customer ID from logs
    const employee = await Employee.findOne().populate('userId');
    const service = await Service.findOne({ name: 'Daily Sparkle' });
    const subscription = await Subscription.findOne({ customerId: customer?._id });
    
    if (!customer || !employee || !service) {
      console.log('❌ Missing required data');
      console.log('   Customer:', customer ? 'Found' : 'Not found');
      console.log('   Employee:', employee ? 'Found' : 'Not found');
      console.log('   Service:', service ? 'Found' : 'Not found');
      return;
    }
    
    // Create a test job with Cloudinary photo URLs
    const job = await Job.create({
      employeeId: employee._id,
      customerId: customer._id,
      subscriptionId: subscription?._id || new mongoose.Types.ObjectId(),
      serviceId: service._id,
      scheduledDate: new Date(),
      completedDate: new Date(),
      status: 'completed',
      beforePhotos: [
        'https://res.cloudinary.com/demo/image/upload/c_limit,w_800,q_auto/carstuneup/job-photos/before-673a1234567890abcdef12345'
      ],
      afterPhotos: [
        'https://res.cloudinary.com/demo/image/upload/c_limit,w_800,q_auto/carstuneup/job-photos/after-673a1234567890abcdef12346'
      ],
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      notes: 'Test job with Cloudinary photos'
    });
    
    console.log('✅ Test job created successfully!');
    console.log(`   Job ID: ${job._id}`);
    console.log(`   Customer: ${customer.name} (${customer.email})`);
    console.log(`   Employee: ${employee.userId.name}`);
    console.log(`   Service: ${service.name}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Before Photos: ${job.beforePhotos.length}`);
    console.log(`   After Photos: ${job.afterPhotos.length}`);
    console.log(`   Photo URLs:`);
    job.beforePhotos?.forEach(photo => console.log(`     - ${photo}`));
    job.afterPhotos?.forEach(photo => console.log(`     - ${photo}`));
    
  } catch (error) {
    console.error('❌ Error creating test job:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
