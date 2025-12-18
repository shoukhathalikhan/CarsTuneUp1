require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/Employee.model');
const Job = require('../models/Job.model');
const User = require('../models/User.model');
const Service = require('../models/Service.model');

console.log('🔍 Testing Employee Jobs Visibility\n');

async function testEmployeeJobs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all employees
    const employees = await Employee.find()
      .populate('userId', 'name email');

    console.log(`📋 Testing jobs for ${employees.length} employees:\n`);

    for (const employee of employees) {
      const employeeName = employee.userId?.name || 'Unknown';
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 Employee: ${employeeName} (${employee.employeeId})`);
      console.log(`   Email: ${employee.userId?.email}`);

      // Get today's jobs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayJobs = await Job.find({
        employeeId: employee._id,
        scheduledDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'in-progress'] }
      })
        .populate('customerId', 'name phone')
        .populate('serviceId', 'name');

      console.log(`   Today's Jobs: ${todayJobs.length}\n`);

      if (todayJobs.length > 0) {
        todayJobs.forEach((job, index) => {
          console.log(`   Job ${index + 1}:`);
          console.log(`      Customer: ${job.customerId?.name || 'N/A'}`);
          console.log(`      Service: ${job.serviceId?.name || 'N/A'}`);
          console.log(`      Time: ${job.scheduledDate.toLocaleTimeString()}`);
          console.log(`      Status: ${job.status}\n`);
        });
      } else {
        console.log(`      No jobs scheduled for today\n`);
      }

      // Get all jobs
      const allJobs = await Job.find({ employeeId: employee._id })
        .sort({ scheduledDate: 1 });

      console.log(`   Total Jobs: ${allJobs.length}`);
      console.log(`   Assigned Customers: ${employee.assignedCustomers.length}`);
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Test Complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   Date: ${new Date().toDateString()}`);
    console.log(`   Time: ${new Date().toLocaleTimeString()}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testEmployeeJobs();
