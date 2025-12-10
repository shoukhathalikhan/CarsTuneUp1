require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription.model');
const Employee = require('../models/Employee.model');
const Job = require('../models/Job.model');
const User = require('../models/User.model');
const Service = require('../models/Service.model');

console.log('🔄 CarsTuneUp - Assign Existing Customers to Employees\n');

async function assignExistingCustomers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all active subscriptions
    const subscriptions = await Subscription.find({ status: 'active' })
      .populate('userId')
      .populate('serviceId');

    if (subscriptions.length === 0) {
      console.log('⚠️  No active subscriptions found.');
      process.exit(0);
    }

    console.log(`📋 Found ${subscriptions.length} active subscriptions\n`);

    // Get all available employees
    const employees = await Employee.find({ isAvailable: true })
      .populate('userId', 'name email')
      .sort({ _id: 1 });

    if (employees.length === 0) {
      console.log('❌ No available employees found.');
      process.exit(1);
    }

    console.log(`👥 Found ${employees.length} available employees\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Reset all employee assignments
    await Employee.updateMany({}, { assignedCustomers: [] });
    console.log('🔄 Reset all employee assignments\n');

    // Delete all existing jobs
    await Job.deleteMany({});
    console.log('🗑️  Deleted all existing jobs\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🚀 Starting customer assignment...\n');

    let employeeIndex = 0;
    let totalJobsCreated = 0;

    for (const subscription of subscriptions) {
      const customer = subscription.userId;
      const service = subscription.serviceId;

      // Find employee with least customers
      const sortedEmployees = await Employee.find({ isAvailable: true })
        .sort({ 'assignedCustomers': 1 });

      const employeesWithCapacity = sortedEmployees.filter(emp => 
        emp.assignedCustomers.length < emp.maxCustomers
      );

      if (employeesWithCapacity.length === 0) {
        console.log(`⚠️  All employees at capacity. Skipping customer: ${customer.name}`);
        continue;
      }

      const assignedEmployee = employeesWithCapacity[0];

      // Assign customer to employee
      if (!assignedEmployee.assignedCustomers.includes(customer._id)) {
        assignedEmployee.assignedCustomers.push(customer._id);
        await assignedEmployee.save();
      }

      // Update subscription
      subscription.assignedEmployee = assignedEmployee._id;
      await subscription.save();

      // Calculate total washes
      const subscriptionDays = Math.ceil(
        (subscription.endDate - subscription.startDate) / (1000 * 60 * 60 * 24)
      );

      const totalWashes = calculateTotalWashes(service.frequency, subscriptionDays);

      // Create all wash jobs
      const jobs = [];
      for (let i = 0; i < totalWashes; i++) {
        const scheduledDate = calculateNextWashDate(subscription.startDate, service.frequency, i);
        
        if (scheduledDate <= subscription.endDate) {
          jobs.push({
            employeeId: assignedEmployee._id,
            customerId: customer._id,
            subscriptionId: subscription._id,
            serviceId: service._id,
            scheduledDate: scheduledDate,
            status: 'scheduled',
            location: {
              address: customer.address
            }
          });
        }
      }

      if (jobs.length > 0) {
        await Job.insertMany(jobs);
        totalJobsCreated += jobs.length;
      }

      const employeeName = assignedEmployee.userId?.name || assignedEmployee.employeeId;
      console.log(`✅ ${customer.name} → ${employeeName} (${jobs.length} jobs created)`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Assignment Complete!\n');

    // Show final statistics
    const updatedEmployees = await Employee.find({ isAvailable: true })
      .populate('userId', 'name email')
      .populate('assignedCustomers', 'name');

    console.log('📊 Final Employee Assignments:\n');
    updatedEmployees.forEach((emp, index) => {
      const employeeName = emp.userId?.name || emp.employeeId;
      console.log(`${index + 1}. ${employeeName} (${emp.employeeId})`);
      console.log(`   Capacity: ${emp.assignedCustomers.length}/${emp.maxCustomers} customers`);
      if (emp.assignedCustomers.length > 0) {
        console.log(`   Customers:`);
        emp.assignedCustomers.forEach((customer, i) => {
          console.log(`      ${i + 1}. ${customer.name}`);
        });
      }
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 Summary:`);
    console.log(`   Total Customers Assigned: ${subscriptions.length}`);
    console.log(`   Total Jobs Created: ${totalJobsCreated}`);
    console.log(`   Total Employees: ${updatedEmployees.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Helper functions
function calculateTotalWashes(frequency, durationDays = 30) {
  switch (frequency) {
    case 'daily':
      return durationDays;
    case '2-days-once':
      return Math.floor(durationDays / 2);
    case '3-days-once':
      return Math.floor(durationDays / 3);
    case 'weekly-once':
      return Math.floor(durationDays / 7);
    case 'one-time':
      return 1;
    default:
      return 1;
  }
}

function calculateNextWashDate(currentDate, frequency, washNumber = 0) {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + washNumber);
      break;
    case '2-days-once':
      nextDate.setDate(nextDate.getDate() + (washNumber * 2));
      break;
    case '3-days-once':
      nextDate.setDate(nextDate.getDate() + (washNumber * 3));
      break;
    case 'weekly-once':
      nextDate.setDate(nextDate.getDate() + (washNumber * 7));
      break;
    case 'one-time':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
  }
  
  return nextDate;
}

// Run the script
assignExistingCustomers();
