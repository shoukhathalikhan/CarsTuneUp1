const mongoose = require('mongoose');
const Subscription = require('../models/Subscription.model');
const Job = require('../models/Job.model');
const Employee = require('../models/Employee.model');
const Service = require('../models/Service.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstune', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Calculate number of washes based on frequency and duration
const calculateTotalWashes = (frequency, durationDays = 30) => {
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
};

// Calculate next wash date based on frequency
const calculateNextWashDate = (currentDate, frequency, washNumber = 0) => {
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
};

// Regenerate schedules for a subscription
const regenerateSchedulesForSubscription = async (subscription) => {
  try {
    if (!subscription.assignedEmployee) {
      console.log(`⏭️  Skipping subscription ${subscription._id} - no assigned employee`);
      return;
    }

    const employee = await Employee.findById(subscription.assignedEmployee)
      .populate('userId', 'name email');
    
    if (!employee) {
      console.log(`❌ Employee not found for subscription ${subscription._id}`);
      return;
    }

    // Delete existing jobs
    const deleteResult = await Job.deleteMany({ subscriptionId: subscription._id });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old jobs for subscription ${subscription._id}`);

    // Calculate total washes
    const subscriptionDays = Math.ceil(
      (subscription.endDate - subscription.startDate) / (1000 * 60 * 60 * 24)
    );
    const service = await Service.findById(subscription.serviceId);
    const totalWashes = calculateTotalWashes(service.frequency, subscriptionDays);

    console.log(`📅 Creating ${totalWashes} jobs for ${service.name} (${service.frequency})`);

    // Create new jobs with correct employee
    const jobs = [];
    for (let i = 0; i < totalWashes; i++) {
      const scheduledDate = calculateNextWashDate(subscription.startDate, service.frequency, i);
      
      if (scheduledDate <= subscription.endDate) {
        try {
          const job = await Job.create({
            employeeId: subscription.assignedEmployee,
            customerId: subscription.userId,
            serviceId: subscription.serviceId,
            subscriptionId: subscription._id,
            scheduledDate: scheduledDate,
            status: 'scheduled',
            location: {
              address: subscription.userId.address || 'Not specified'
            }
          });
          
          jobs.push(job);
          console.log(`✅ Created job for ${scheduledDate.toDateString()} - ${employee.userId?.name || employee.employeeId}`);
        } catch (error) {
          console.error(`❌ Failed to create job for ${scheduledDate.toDateString()}:`, error.message);
        }
      }
    }

    console.log(`✨ Regenerated ${jobs.length} jobs for subscription ${subscription._id} with employee ${employee.userId?.name || employee.employeeId}\n`);
  } catch (error) {
    console.error(`Error regenerating schedules for subscription ${subscription._id}:`, error);
  }
};

// Main function
const regenerateAllSchedules = async () => {
  try {
    console.log('🚀 Starting schedule regeneration...\n');

    // Get all active subscriptions with assigned employees
    const subscriptions = await Subscription.find({
      status: 'active',
      assignedEmployee: { $ne: null }
    })
    .populate('userId')
    .populate('serviceId');

    console.log(`Found ${subscriptions.length} active subscriptions with assigned employees\n`);

    for (const subscription of subscriptions) {
      await regenerateSchedulesForSubscription(subscription);
    }

    console.log('✅ Schedule regeneration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

// Run the script
regenerateAllSchedules();
