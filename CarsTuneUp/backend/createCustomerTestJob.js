const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
const Subscription = require('./models/Subscription.model');
const Service = require('./models/Service.model');
const Employee = require('./models/Employee.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Creating test job for logged-in customer...');
  
  try {
    // Find the logged-in customer
    const customer = await User.findOne({ email: 'shoukhat2003@gmail.com' });
    
    // Find employee and service
    const employee = await Employee.findOne().populate('userId');
    const service = await Service.findOne({ name: 'Daily Sparkle' });
    
    // Find an existing subscription for this customer
    const subscription = await Subscription.findOne({ userId: customer._id });
    
    if (!customer || !employee || !service) {
      console.log('❌ Missing required data');
      console.log('   Customer:', customer ? customer.name : 'Not found');
      console.log('   Employee:', employee ? employee.userId.name : 'Not found');
      console.log('   Service:', service ? service.name : 'Not found');
      return;
    }
    
    console.log(`👤 Creating job for: ${customer.name}`);
    console.log(`📋 Service: ${service.name}`);
    console.log(`👨‍💼 Employee: ${employee.userId.name}`);
    console.log(`📄 Subscription: ${subscription?._id || 'Will create new'}`);
    
    // Create a completed job with Cloudinary photos
    const job = await Job.create({
      employeeId: employee._id,
      customerId: customer._id,
      subscriptionId: subscription?._id || new mongoose.Types.ObjectId(),
      serviceId: service._id,
      scheduledDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      completedDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      status: 'completed',
      beforePhotos: [
        'https://res.cloudinary.com/demo/image/upload/c_limit,w_800,q_auto/carstuneup/job-photos/before-customer-test-12345'
      ],
      afterPhotos: [
        'https://res.cloudinary.com/demo/image/upload/c_limit,w_800,q_auto/carstuneup/job-photos/after-customer-test-12346'
      ],
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      notes: 'Test job with Cloudinary photos for customer home page display'
    });
    
    console.log('\n✅ Test job created successfully!');
    console.log(`   Job ID: ${job._id}`);
    console.log(`   Customer: ${customer.name} (${customer.email})`);
    console.log(`   Employee: ${employee.userId.name}`);
    console.log(`   Service: ${service.name}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Before Photos: ${job.beforePhotos.length}`);
    console.log(`   After Photos: ${job.afterPhotos.length}`);
    console.log(`   Photo URLs:`);
    job.beforePhotos.forEach(photo => console.log(`     - ${photo}`));
    job.afterPhotos.forEach(photo => console.log(`     - ${photo}`));
    
    // Verify it will be displayed
    const shouldDisplay = (job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && job.status === 'completed';
    console.log(`\n📱 Will display on home page: ${shouldDisplay ? 'YES ✅' : 'NO ❌'}`);
    
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
