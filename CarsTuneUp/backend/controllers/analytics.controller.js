const User = require('../models/User.model');
const Subscription = require('../models/Subscription.model');
const Employee = require('../models/Employee.model');
const Job = require('../models/Job.model');

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalCustomers = await User.countDocuments({ role: 'customer', isActive: true });
    const totalEmployees = await Employee.countDocuments({ isAvailable: true });
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    
    // Get today's jobs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayJobs = await Job.countDocuments({
      scheduledDate: { $gte: today, $lt: tomorrow }
    });
    
    // Get revenue (sum of completed subscriptions)
    const revenueData = await Subscription.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    
    res.status(200).json({
      status: 'success',
      data: {
        totalCustomers,
        totalEmployees,
        activeSubscriptions,
        completedJobs,
        todayJobs,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching dashboard statistics'
    });
  }
};

// @desc    Get revenue statistics
// @route   GET /api/analytics/revenue
// @access  Admin
exports.getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchFilter = { paymentStatus: 'completed' };
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }
    
    const revenueByMonth = await Subscription.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: { revenueByMonth }
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching revenue statistics'
    });
  }
};

// @desc    Get employee performance
// @route   GET /api/analytics/employee-performance
// @access  Admin
exports.getEmployeePerformance = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('userId', 'name email')
      .sort({ totalJobsCompleted: -1 });
    
    const performance = employees.map(emp => ({
      employeeId: emp.employeeId,
      name: emp.userId.name,
      email: emp.userId.email,
      area: emp.area,
      totalJobsCompleted: emp.totalJobsCompleted,
      rating: emp.rating,
      totalRatings: emp.totalRatings,
      isAvailable: emp.isAvailable
    }));
    
    res.status(200).json({
      status: 'success',
      results: performance.length,
      data: { performance }
    });
  } catch (error) {
    console.error('Get employee performance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching employee performance'
    });
  }
};
