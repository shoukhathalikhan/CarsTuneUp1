const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const Employee = require('./models/Employee.model');
const User = require('./models/User.model');
require('dotenv').config();

async function checkActiveJobs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`📋 Checking active jobs for ${today.toDateString()}\n`);

    // Check for active/scheduled jobs today
    const activeJobs = await Job.find({
      scheduledDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'in-progress'] }
    }).populate('employeeId', 'employeeId').populate('customerId', 'name').populate('serviceId', 'name');

    console.log(`Found ${activeJobs.length} active jobs for today:`);
    
    if (activeJobs.length === 0) {
      console.log('❌ No active jobs found for today');
      
      // Check for any jobs assigned today (including completed)
      const allJobsToday = await Job.find({
        scheduledDate: { $gte: today, $lt: tomorrow }
      }).populate('employeeId', 'employeeId');
      
      console.log(`\n📊 All jobs for today (including completed): ${allJobsToday.length}`);
      
      allJobsToday.forEach((job, index) => {
        console.log(`${index + 1}. Job ID: ${job._id}`);
        console.log(`   Employee: ${job.employeeId?.employeeId || 'Unassigned'}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Time: ${job.scheduledDate.toLocaleTimeString()}`);
        console.log('');
      });
      
    } else {
      activeJobs.forEach((job, index) => {
        console.log(`${index + 1}. Job ID: ${job._id}`);
        console.log(`   Customer: ${job.customerId?.name || 'Unknown'}`);
        console.log(`   Employee: ${job.employeeId?.employeeId || 'Unassigned'}`);
        console.log(`   Service: ${job.serviceId?.name || 'Unknown'}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Time: ${job.scheduledDate.toLocaleTimeString()}`);
        console.log('');
      });
    }

    // Test employee job fetching
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Testing Employee Job Fetching:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const employees = await Employee.find({ isAvailable: true }).populate('userId', 'name');
    
    for (const employee of employees) {
      console.log(`\n👤 Employee: ${employee.userId?.name || employee.employeeId}`);
      
      // Test today's jobs query (same as employee app)
      const todayJobs = await Job.find({
        employeeId: employee._id,
        scheduledDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'in-progress'] }
      }).populate('customerId', 'name phone').populate('serviceId', 'name');

      console.log(`   Today's Jobs: ${todayJobs.length}`);
      todayJobs.forEach((job, index) => {
        console.log(`     ${index + 1}. ${job.customerId?.name} - ${job.serviceId?.name} (${job.status})`);
      });
      
      // Test all jobs query
      const allJobs = await Job.find({ employeeId: employee._id })
        .sort({ scheduledDate: 1 });

      console.log(`   All Jobs: ${allJobs.length}`);
      console.log(`   Assigned Customers: ${employee.assignedCustomers.length}`);
    }

    console.log('\n✅ Check Complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkActiveJobs();
