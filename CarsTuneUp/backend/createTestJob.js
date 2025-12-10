const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
const Subscription = require('./models/Subscription.model');
const Service = require('./models/Service.model');
const Employee = require('./models/Employee.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Creating test job with photos...');
  
  try {
    // Find existing data
    const customer = await User.findOne({ role: 'customer' });
    const employee = await Employee.findOne().populate('userId');
    const service = await Service.findOne();
    const subscription = await Subscription.findOne({ customerId: customer?._id });
    
    if (!customer || !employee || !service) {
      console.log('❌ Missing required data. Please ensure:');
      console.log('   - At least one customer user exists');
      console.log('   - At least one employee exists');
      console.log('   - At least one service exists');
      return;
    }
    
    // Create a test job with photos
    const job = await Job.create({
      employeeId: employee._id,
      customerId: customer._id,
      subscriptionId: subscription?._id || new mongoose.Types.ObjectId(),
      serviceId: service._id,
      scheduledDate: new Date(),
      completedDate: new Date(),
      status: 'completed',
      beforePhotos: ['/uploads/job-photos/before-sample.jpg'],
      afterPhotos: ['/uploads/job-photos/after-sample.jpg'],
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      notes: 'Test job with sample photos'
    });
    
    console.log('✅ Test job created successfully!');
    console.log(`   Job ID: ${job._id}`);
    console.log(`   Customer: ${customer.name}`);
    console.log(`   Employee: ${employee.userId.name}`);
    console.log(`   Service: ${service.name}`);
    console.log(`   Before Photos: ${job.beforePhotos.length}`);
    console.log(`   After Photos: ${job.afterPhotos.length}`);
    
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
