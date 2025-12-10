const mongoose = require('mongoose');
const { assignJobToBestEmployee } = require('./services/smartEmployeeAssignment');
const Job = require('./models/Job.model');
const Employee = require('./models/Employee.model');
const User = require('./models/User.model');
const Service = require('./models/Service.model');
require('dotenv').config();

async function testTodayJob() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    console.log(`🧪 Creating test job for ${today.toDateString()}\n`);

    // Get a test customer and service
    const testCustomer = await User.findOne({ role: 'customer' });
    const testService = await Service.findOne();

    if (!testCustomer || !testService) {
      console.log('❌ Could not find test customer or service');
      process.exit(1);
    }

    console.log(`📝 Customer: ${testCustomer.name}`);
    console.log(`📝 Service: ${testService.name}`);
    console.log(`📝 Date: ${today.toDateString()}\n`);

    // Create a job for today using smart assignment
    const result = await assignJobToBestEmployee({
      scheduledDate: today,
      customerId: testCustomer._id,
      serviceId: testService._id,
      subscriptionId: null,
      location: { 
        address: testCustomer.address?.street || 'Test Address',
        city: testCustomer.address?.city || 'Test City'
      }
    });

    console.log(`✅ Test job created successfully!`);
    console.log(`   Job ID: ${result.job._id}`);
    console.log(`   Employee: ${result.assignedEmployee.userId?.name || result.assignedEmployee.employeeId}`);
    console.log(`   Status: ${result.job.status}`);
    console.log(`   Date: ${result.job.scheduledDate.toDateString()}`);

    // Now test if this job appears in Today's Jobs
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Testing Today\'s Jobs Fetch:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayJobs = await Job.find({
      employeeId: result.assignedEmployee._id,
      scheduledDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['scheduled', 'in-progress'] }
    }).populate('customerId', 'name').populate('serviceId', 'name');

    console.log(`📋 Today's Jobs for ${result.assignedEmployee.userId?.name}: ${todayJobs.length}`);
    
    todayJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.customerId?.name} - ${job.serviceId?.name} (${job.status})`);
    });

    // Test all jobs
    const allJobs = await Job.find({ employeeId: result.assignedEmployee._id })
      .sort({ scheduledDate: 1 });

    console.log(`\n📋 All Jobs for ${result.assignedEmployee.userId?.name}: ${allJobs.length}`);

    // Clean up test job
    await Job.findByIdAndDelete(result.job._id);
    console.log(`\n🧹 Test job cleaned up`);

    console.log('\n✅ Test Complete!');
    console.log(`\n📊 Results:`);
    console.log(`   Today's Jobs (should be 1): ${todayJobs.length}`);
    console.log(`   All Jobs: ${allJobs.length}`);
    console.log(`   Job Status: ${result.job.status}`);
    
    if (todayJobs.length === 1) {
      console.log(`\n🎉 SUCCESS: Jobs are now appearing in Today's Jobs!`);
    } else {
      console.log(`\n❌ ISSUE: Job not appearing in Today's Jobs`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testTodayJob();
