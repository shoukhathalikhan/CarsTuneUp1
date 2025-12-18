const mongoose = require('mongoose');
const Subscription = require('../models/Subscription.model');
const Employee = require('../models/Employee.model');
const Job = require('../models/Job.model');
const User = require('../models/User.model');
const Service = require('../models/Service.model');
const { sendPushNotification } = require('./notification.service');

// Calculate number of washes based on frequency and duration
const calculateTotalWashes = (frequency, durationDays = 30) => {
  switch (frequency) {
    case 'daily':
      return durationDays; // 30 washes for 30 days
    case '2-days-once':
      return Math.floor(durationDays / 2); // 15 washes
    case '3-days-once':
      return Math.floor(durationDays / 3); // 10 washes
    case 'weekly-once':
      return Math.floor(durationDays / 7); // 4 washes
    case 'one-time':
      return 1; // Single wash
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
      // Single wash, schedule for tomorrow
      nextDate.setDate(nextDate.getDate() + 1);
      break;
  }
  
  return nextDate;
};

// Assign employee to customer and create all wash jobs
exports.assignEmployeeToSubscription = async (subscriptionId) => {
  try {
    const subscription = await Subscription.findById(subscriptionId)
      .populate('userId')
      .populate('serviceId');
    
    if (!subscription) {
      console.log('Subscription not found');
      return;
    }

    const customerId = subscription.userId._id;
    const service = subscription.serviceId;

    // Step 1: Check if customer already has an assigned employee
    let assignedEmployee = null;
    
    if (subscription.assignedEmployee) {
      assignedEmployee = await Employee.findById(subscription.assignedEmployee)
        .populate('userId', 'name email');
      console.log(`Customer already assigned to employee: ${assignedEmployee.userId?.name}`);
    } else {
      // Step 2: Find employee with least customers (under max capacity)
      const availableEmployees = await Employee.find({
        isAvailable: true
      })
      .populate('userId', 'name email')
      .sort({ 'assignedCustomers': 1, _id: 1 }); // Sort by customer count

      // Filter employees with capacity
      const employeesWithCapacity = availableEmployees.filter(emp => 
        emp.assignedCustomers.length < emp.maxCustomers
      );

      if (employeesWithCapacity.length === 0) {
        console.log('All employees at full capacity (6 customers each)');
        return;
      }

      assignedEmployee = employeesWithCapacity[0];

      // Assign customer to employee
      if (!assignedEmployee.assignedCustomers.includes(customerId)) {
        assignedEmployee.assignedCustomers.push(customerId);
        await assignedEmployee.save();
      }

      // Update subscription
      subscription.assignedEmployee = assignedEmployee._id;
      await subscription.save();

      const employeeName = assignedEmployee.userId?.name || assignedEmployee.employeeId;
      console.log(`Assigned new customer to ${employeeName}. Total customers: ${assignedEmployee.assignedCustomers.length}`);
    }

    // Step 3: Calculate total washes for this subscription
    const subscriptionDays = Math.ceil(
      (subscription.endDate - subscription.startDate) / (1000 * 60 * 60 * 24)
    );
    const totalWashes = calculateTotalWashes(service.frequency, subscriptionDays);

    console.log(`Creating ${totalWashes} wash jobs for subscription (${service.frequency})`);
    console.log(`Using admin-assigned employee: ${assignedEmployee.userId?.name || assignedEmployee.employeeId}`);

    // Step 4: Create all wash jobs for the subscription period with the assigned employee
    const jobs = [];
    for (let i = 0; i < totalWashes; i++) {
      const scheduledDate = calculateNextWashDate(subscription.startDate, service.frequency, i);
      
      if (scheduledDate <= subscription.endDate) {
        try {
          // Create job with the admin-assigned employee (no smart assignment)
          const job = await Job.create({
            employeeId: assignedEmployee._id,
            customerId: customerId,
            serviceId: service._id,
            subscriptionId: subscription._id,
            scheduledDate: scheduledDate,
            status: 'scheduled',
            location: {
              address: subscription.userId.address
            }
          });
          
          jobs.push(job);
          console.log(`✅ Job assigned to ${assignedEmployee.userId?.name || assignedEmployee.employeeId} for ${scheduledDate.toDateString()}`);
        } catch (error) {
          console.error(`❌ Failed to create job for ${scheduledDate.toDateString()}:`, error.message);
          // Continue with other jobs even if one fails
        }
      }
    }

    console.log(`Created ${jobs.length} jobs for customer ${subscription.userId.name} with employee ${assignedEmployee.userId?.name || assignedEmployee.employeeId}`);

    return {
      success: true,
      jobsCreated: jobs.length,
      message: `Successfully created ${jobs.length} jobs assigned to ${assignedEmployee.userId?.name || assignedEmployee.employeeId}`
    };
  } catch (error) {
    console.error('Error assigning employee and creating jobs:', error);
    throw error;
  }
};

// Assign individual job (for immediate bookings)
exports.assignIndividualJob = async (customerId, serviceId, scheduledDate, location) => {
  try {
    console.log(`🔍 Assigning individual job for ${scheduledDate.toDateString()}`);
    
    // Use smart assignment for the single job
    const jobAssignment = await assignJobToBestEmployee({
      scheduledDate: scheduledDate,
      customerId: customerId,
      serviceId: serviceId,
      subscriptionId: null, // Individual booking, not subscription
      location: location
    });
    
    console.log(`✅ Individual job assigned to ${jobAssignment.assignedEmployee.userId?.name || jobAssignment.assignedEmployee.employeeId}`);
    
    return {
      success: true,
      job: jobAssignment.job,
      assignedEmployee: jobAssignment.assignedEmployee
    };
  } catch (error) {
    console.error('Error assigning individual job:', error);
    throw error;
  }
};

// Get employee statistics
exports.getEmployeeStats = async () => {
  try {
    const employees = await Employee.find({ isAvailable: true })
      .populate('userId', 'name email')
      .populate('assignedCustomers', 'name email');

    const stats = employees.map(emp => ({
      employeeId: emp.employeeId,
      name: emp.userId?.name || 'Unknown',
      email: emp.userId?.email,
      assignedCustomers: emp.assignedCustomers.length,
      maxCustomers: emp.maxCustomers,
      capacity: `${emp.assignedCustomers.length}/${emp.maxCustomers}`,
      customers: emp.assignedCustomers.map(c => c.name)
    }));

    return {
      success: true,
      totalEmployees: employees.length,
      data: stats
    };
  } catch (error) {
    console.error('Error getting employee stats:', error);
    throw error;
  }
};

// Run automatic job assignment for all active subscriptions
exports.assignJobsAutomatically = async () => {
  try {
    // Reset daily job counts
    await Employee.updateMany({}, { assignedJobsToday: 0, lastResetDate: new Date() });
    
    // Get all active subscriptions without assigned employees
    const subscriptions = await Subscription.find({
      status: 'active',
      assignedEmployee: null
    });
    
    for (const subscription of subscriptions) {
      await exports.assignEmployeeToSubscription(subscription._id);
    }
    
    console.log(`Auto-assigned jobs for ${subscriptions.length} subscriptions`);
  } catch (error) {
    console.error('Error in automatic job assignment:', error);
  }
};

// Send notifications for upcoming washes
exports.sendUpcomingWashNotifications = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    // Find subscriptions with wash scheduled for tomorrow
    const upcomingSubscriptions = await Subscription.find({
      status: 'active',
      nextWashDate: { $gte: tomorrow, $lt: dayAfter }
    }).populate('userId serviceId assignedEmployee');
    
    for (const subscription of upcomingSubscriptions) {
      const user = await User.findById(subscription.userId);
      
      if (user && user.fcmToken) {
        await sendPushNotification(
          user.fcmToken,
          'Upcoming Car Wash',
          `Your ${subscription.serviceId.name} is scheduled for tomorrow!`,
          { type: 'upcoming_wash', subscriptionId: subscription._id.toString() }
        );
      }
    }
    
    console.log(`Sent notifications for ${upcomingSubscriptions.length} upcoming washes`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};
