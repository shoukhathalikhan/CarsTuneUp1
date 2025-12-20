const Subscription = require('../models/Subscription.model');
const Service = require('../models/Service.model');
const Employee = require('../models/Employee.model');
const { assignEmployeeToSubscription } = require('../services/automation.service');

// Calculate next wash date based on frequency
// For the first wash, use the start date itself
const calculateNextWashDate = (startDate, frequency) => {
  const date = new Date(startDate);
  
  switch (frequency) {
    case 'daily':
      // First wash is on the start date
      // Subsequent washes will be scheduled daily
      break;
    case 'weekly':
      // First wash is on the start date
      // Subsequent washes will be scheduled weekly
      break;
    case 'biweekly':
      // First wash is on the start date
      // Subsequent washes will be scheduled biweekly
      break;
    case 'monthly':
      // First wash is on the start date
      // Subsequent washes will be scheduled monthly
      break;
    default:
      // Default to weekly
      break;
  }
  
  return date;
};

// Calculate end date based on frequency (assuming 1 month subscription)
const calculateEndDate = (startDate) => {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 1);
  return date;
};

// @desc    Create new subscription
// @route   POST /api/subscriptions
// @access  Customer
exports.createSubscription = async (req, res) => {
  try {
    const { serviceId, paymentId } = req.body;
    
    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }
    
    // Create subscription without start date - admin will set it
    // Set a placeholder end date (will be updated by admin)
    const placeholderEndDate = new Date();
    placeholderEndDate.setMonth(placeholderEndDate.getMonth() + 1);
    
    // Create subscription
    const subscription = await Subscription.create({
      userId: req.user._id,
      serviceId,
      startDate: null,
      endDate: placeholderEndDate,
      nextWashDate: null,
      amount: service.price,
      paymentId,
      paymentStatus: 'completed',
      status: 'pending'
    });
    
    // Populate subscription data
    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate('serviceId')
      .populate({
        path: 'assignedEmployee',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      });
    
    res.status(201).json({
      status: 'success',
      message: 'Subscription created successfully. Admin will assign an employee and set the start date.',
      data: { subscription: populatedSubscription }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error creating subscription'
    });
  }
};

// @desc    Get my subscriptions
// @route   GET /api/subscriptions/my-subscriptions
// @access  Customer
exports.getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id })
      .populate('serviceId')
      .populate({
        path: 'assignedEmployee',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: subscriptions.length,
      data: { subscriptions }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching subscriptions'
    });
  }
};

// @desc    Get all subscriptions
// @route   GET /api/subscriptions
// @access  Admin
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const subscriptions = await Subscription.find(filter)
      .populate('userId', 'name email phone')
      .populate('serviceId')
      .populate({
        path: 'assignedEmployee',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: subscriptions.length,
      data: { subscriptions }
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching subscriptions'
    });
  }
};

// @desc    Get pending subscriptions (awaiting admin assignment)
// @route   GET /api/subscriptions/pending
// @access  Admin
exports.getPendingSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ status: 'pending' })
      .populate('userId', 'name email phone address')
      .populate('serviceId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: subscriptions.length,
      data: { subscriptions }
    });
  } catch (error) {
    console.error('Get pending subscriptions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching pending subscriptions'
    });
  }
};

// @desc    Get subscription by ID
// @route   GET /api/subscriptions/:id
// @access  Admin, Customer (own)
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('userId')
      .populate('serviceId')
      .populate({
        path: 'assignedEmployee',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      });
    
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
    }
    
    // Check if customer is accessing their own subscription
    if (req.user.role === 'customer' && subscription.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { subscription }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching subscription'
    });
  }
};

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/:id/cancel
// @access  Customer
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
    }
    
    // Check ownership
    if (subscription.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    subscription.status = 'cancelled';
    await subscription.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Subscription cancelled successfully',
      data: { subscription }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error cancelling subscription'
    });
  }
};

// @desc    Assign employee and set start date with automatic schedule generation
// @route   PUT /api/subscriptions/:id/assign-employee
// @access  Admin
exports.assignEmployee = async (req, res) => {
  try {
    const { employeeId, startDate } = req.body;
    
    if (!employeeId || !startDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Employee ID and start date are required'
      });
    }
    
    const subscription = await Subscription.findById(req.params.id)
      .populate('userId')
      .populate('serviceId');
    
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
    }
    
    const employee = await Employee.findById(employeeId)
      .populate('userId', 'name email phone fcmToken');
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }
    
    // Set start date and calculate end date
    const newStartDate = new Date(startDate);
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);
    
    // Update subscription
    subscription.assignedEmployee = employeeId;
    subscription.startDate = newStartDate;
    subscription.endDate = newEndDate;
    subscription.status = 'active';
    await subscription.save();
    
    // Delete any existing jobs for this subscription to avoid duplicate/incorrect assignments
    const Job = require('../models/Job.model');
    const deleteResult = await Job.deleteMany({ subscriptionId: subscription._id });
    console.log(`Deleted ${deleteResult.deletedCount} existing jobs for subscription ${subscription._id}`);
    
    // Generate schedules automatically with the admin-assigned employee
    const { assignEmployeeToSubscription } = require('../services/automation.service');
    const scheduleResult = await assignEmployeeToSubscription(subscription._id);
    
    // Send notifications to employee and customer
    const { sendPushNotification } = require('../services/notification.service');
    
    // Notify employee
    if (employee.userId?.fcmToken) {
      try {
        await sendPushNotification(
          employee.userId.fcmToken,
          'New Service Assignment',
          `You have been assigned ${scheduleResult.jobsCreated} wash jobs for customer ${subscription.userId.name}`,
          {
            subscriptionId: subscription._id.toString(),
            type: 'new_assignment'
          }
        );
      } catch (error) {
        console.error('Error sending employee notification:', error);
      }
    }
    
    // Notify customer about employee assignment and schedule
    if (subscription.userId.fcmToken) {
      try {
        await sendPushNotification(
          subscription.userId.fcmToken,
          '👨‍🔧 Employee Assigned & Schedule Sent',
          `Great news! ${employee.userId.name} has been assigned to your ${subscription.serviceId.name} service. ${scheduleResult.jobsCreated} service schedules have been created and sent to you.`,
          {
            subscriptionId: subscription._id.toString(),
            employeeName: employee.userId.name,
            serviceName: subscription.serviceId.name,
            jobsCreated: scheduleResult.jobsCreated,
            type: 'employee_assigned'
          }
        );
      } catch (error) {
        console.error('Error sending customer notification:', error);
      }
    }
    
    // Populate updated subscription
    const updatedSubscription = await Subscription.findById(subscription._id)
      .populate('serviceId')
      .populate({
        path: 'assignedEmployee',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      });
    
    res.status(200).json({
      status: 'success',
      message: 'Employee assigned and schedules generated successfully',
      data: { subscription: updatedSubscription }
    });
  } catch (error) {
    console.error('Assign employee error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error assigning employee'
    });
  }
};

// @desc    Regenerate all schedules with correct employee assignments
// @route   POST /api/subscriptions/admin/regenerate-all-schedules
// @access  Admin
exports.regenerateAllSchedules = async (req, res) => {
  try {
    const Job = require('../models/Job.model');
    
    // Get all active subscriptions with assigned employees
    const subscriptions = await Subscription.find({
      status: 'active',
      assignedEmployee: { $ne: null }
    })
    .populate('userId')
    .populate('serviceId')
    .populate({
      path: 'assignedEmployee',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    });

    console.log(`🚀 Starting regeneration for ${subscriptions.length} subscriptions`);

    let totalJobsDeleted = 0;
    let totalJobsCreated = 0;

    for (const subscription of subscriptions) {
      try {
        // Delete existing jobs
        const deleteResult = await Job.deleteMany({ subscriptionId: subscription._id });
        totalJobsDeleted += deleteResult.deletedCount;
        
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} jobs for subscription ${subscription._id}`);

        // Regenerate schedules with correct employee
        const scheduleResult = await assignEmployeeToSubscription(subscription._id);
        totalJobsCreated += scheduleResult.jobsCreated;
        
        console.log(`✅ Regenerated ${scheduleResult.jobsCreated} jobs with employee ${subscription.assignedEmployee.userId?.name}`);
      } catch (error) {
        console.error(`❌ Error regenerating subscription ${subscription._id}:`, error.message);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'All schedules regenerated successfully',
      data: {
        subscriptionsProcessed: subscriptions.length,
        jobsDeleted: totalJobsDeleted,
        jobsCreated: totalJobsCreated
      }
    });
  } catch (error) {
    console.error('Regenerate schedules error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error regenerating schedules'
    });
  }
};
