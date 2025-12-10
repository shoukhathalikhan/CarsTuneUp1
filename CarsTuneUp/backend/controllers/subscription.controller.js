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
    const { serviceId, paymentId, startDate } = req.body;
    
    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }
    
    // Use user-selected date or default to today
    const selectedStartDate = startDate ? new Date(startDate) : new Date();
    
    // Ensure start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedStartDate < today) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date cannot be in the past'
      });
    }
    
    const endDate = calculateEndDate(selectedStartDate);
    const nextWashDate = calculateNextWashDate(selectedStartDate, service.frequency);
    
    // Create subscription
    const subscription = await Subscription.create({
      userId: req.user._id,
      serviceId,
      startDate: selectedStartDate,
      endDate,
      nextWashDate,
      amount: service.price,
      paymentId,
      paymentStatus: 'completed'
    });
    
    // Auto-assign employee
    await assignEmployeeToSubscription(subscription._id);
    
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
      message: 'Subscription created successfully',
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

// @desc    Assign employee to subscription
// @route   PUT /api/subscriptions/:id/assign-employee
// @access  Admin
exports.assignEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
    }
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }
    
    subscription.assignedEmployee = employeeId;
    await subscription.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Employee assigned successfully',
      data: { subscription }
    });
  } catch (error) {
    console.error('Assign employee error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error assigning employee'
    });
  }
};
