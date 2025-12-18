const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
const Subscription = require('./models/Subscription.model');
const Service = require('./models/Service.model');
const Employee = require('./models/Employee.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Fixing test job with proper subscription...');
  
  try {
    // Find the customer who's logged in (from the logs)
    const customer = await User.findOne({ email: 'shoukhat2003@gmail.com' });
    
    // Find a real subscription for this customer
    const subscription = await Subscription.findOne({ userId: customer._id });
    
    // Find the test job we created
    const testJob = await Job.findById('69258395b9d0a796c6215c2b');
    
    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }
    
    if (!subscription) {
      console.log('❌ No subscription found for customer, creating one...');
      
      // Create a subscription for the customer
      const employee = await Employee.findOne().populate('userId');
      const service = await Service.findOne({ name: 'Daily Sparkle' });
      
      if (!employee || !service) {
        console.log('❌ Employee or service not found');
        return;
      }
      
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const nextWashDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      
      const newSubscription = await Subscription.create({
        userId: customer._id, // Use userId field
        serviceId: service._id,
        startDate: startDate,
        endDate: endDate,
        nextWashDate: nextWashDate,
        amount: service.price,
        assignedEmployee: employee._id,
        paymentStatus: 'completed',
        autoRenew: false,
        completedWashes: 1
      });
      
      console.log('✅ Created new subscription:', newSubscription._id);
      
      // Update the test job with the real subscription ID
      await Job.findByIdAndUpdate('69258395b9d0a796c6215c2b', {
        subscriptionId: newSubscription._id
      });
      
      console.log('✅ Updated test job with real subscription ID');
      
    } else {
      console.log('✅ Found existing subscription:', subscription._id);
      
      // Update the test job with the real subscription ID
      await Job.findByIdAndUpdate('69258395b9d0a796c6215c2b', {
        subscriptionId: subscription._id
      });
      
      console.log('✅ Updated test job with real subscription ID');
    }
    
    // Verify the job is properly linked
    const updatedJob = await Job.findById('69258395b9d0a796c6215c2b')
      .populate('customerId', 'name email')
      .populate('subscriptionId', 'status planType')
      .populate('serviceId', 'name');
    
    console.log('\n📋 Updated Job Details:');
    console.log('═══════════════════════════════════════════');
    console.log(`   Job ID: ${updatedJob._id}`);
    console.log(`   Customer: ${updatedJob.customerId?.name} (${updatedJob.customerId?.email})`);
    console.log(`   Subscription: ${updatedJob.subscriptionId?._id} (${updatedJob.subscriptionId?.status})`);
    console.log(`   Service: ${updatedJob.serviceId?.name}`);
    console.log(`   Status: ${updatedJob.status}`);
    console.log(`   Before Photos: ${updatedJob.beforePhotos?.length || 0}`);
    console.log(`   After Photos: ${updatedJob.afterPhotos?.length || 0}`);
    
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
