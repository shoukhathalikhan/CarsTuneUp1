const mongoose = require('mongoose');
const { getAvailableEmployeesForDate, assignJobToBestEmployee, rebalanceJobsForDate } = require('./services/smartEmployeeAssignment');
const Job = require('./models/Job.model');
const Employee = require('./models/Employee.model');
require('dotenv').config();

async function testSmartAssignment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check current employee loads for today
    const today = new Date();
    console.log(`📊 Testing smart assignment for ${today.toDateString()}\n`);
    
    const availableEmployees = await getAvailableEmployeesForDate(today);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Available Employees for Today:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (availableEmployees.length === 0) {
      console.log('❌ No employees available for today (all at capacity)');
    } else {
      availableEmployees.forEach((emp, index) => {
        const employeeName = emp.userId?.name || emp.employeeId;
        console.log(`${index + 1}. ${employeeName} (${emp.employeeId})`);
        console.log(`   Current Jobs: ${emp.currentJobCount}/${emp.dailyJobLimit || 6}`);
        console.log(`   Remaining Capacity: ${emp.remainingCapacity}`);
        console.log(`   Available: ${emp.isAvailable ? '✅' : '❌'}`);
        console.log('');
      });
    }

    // Test 2: Check existing jobs for today
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayJobs = await Job.find({
      scheduledDate: { $gte: startOfDay, $lt: endOfDay }
    }).populate('employeeId', 'employeeId').populate('customerId', 'name');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Today\'s Jobs:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (todayJobs.length === 0) {
      console.log('❌ No jobs scheduled for today');
    } else {
      todayJobs.forEach((job, index) => {
        const employeeName = job.employeeId?.employeeId || 'Unassigned';
        const customerName = job.customerId?.name || 'Unknown';
        console.log(`${index + 1}. Job ID: ${job._id}`);
        console.log(`   Customer: ${customerName}`);
        console.log(`   Employee: ${employeeName}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Time: ${job.scheduledDate.toLocaleTimeString()}`);
        console.log('');
      });
    }

    // Test 3: Try to assign a test job
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Testing Job Assignment:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // Get a test customer and service
      const testCustomer = await mongoose.model('User').findOne({ role: 'customer' });
      const testService = await mongoose.model('Service').findOne();

      if (testCustomer && testService) {
        console.log(`📝 Attempting to assign job for customer: ${testCustomer.name}`);
        console.log(`📝 Service: ${testService.name}`);
        
        const result = await assignJobToBestEmployee({
          scheduledDate: today,
          customerId: testCustomer._id,
          serviceId: testService._id,
          subscriptionId: null,
          location: { address: 'Test Location' }
        });

        console.log(`✅ Test job assigned successfully!`);
        console.log(`   Employee: ${result.assignedEmployee.userId?.name || result.assignedEmployee.employeeId}`);
        console.log(`   Job ID: ${result.job._id}`);
        
        // Clean up test job
        await Job.findByIdAndDelete(result.job._id);
        console.log(`🧹 Test job cleaned up`);
        
      } else {
        console.log('❌ Could not find test customer or service');
      }
    } catch (error) {
      console.log(`❌ Test job assignment failed: ${error.message}`);
    }

    // Test 4: Rebalance today's jobs if needed
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚖️  Rebalancing Today\'s Jobs:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const rebalanceResult = await rebalanceJobsForDate(today);
    console.log(`✅ Rebalancing Complete:`);
    console.log(`   Total Jobs: ${rebalanceResult.totalJobs}`);
    console.log(`   Over-assigned: ${rebalanceResult.overAssignedJobs}`);
    console.log(`   Reassigned: ${rebalanceResult.reassignedJobs}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Smart Assignment Test Complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   Date: ${today.toDateString()}`);
    console.log(`   Available Employees: ${availableEmployees.length}`);
    console.log(`   Today's Jobs: ${todayJobs.length}`);
    console.log(`   Reassigned Jobs: ${rebalanceResult.reassignedJobs}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testSmartAssignment();
