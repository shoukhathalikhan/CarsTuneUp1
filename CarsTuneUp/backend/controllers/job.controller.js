const Job = require('../models/Job.model');
const Employee = require('../models/Employee.model');
const Subscription = require('../models/Subscription.model');
const { uploadJobPhoto } = require('../middleware/cloudinaryStorage');
const { deletePhotos } = require('../utils/photoUtils');

// Middleware for photo uploads
exports.uploadBeforePhotoMiddleware = uploadJobPhoto.single('beforePhoto');
exports.uploadAfterPhotoMiddleware = uploadJobPhoto.single('afterPhoto');

// @desc    Upload before photo
// @route   POST /api/jobs/:id/before-photo
// @access  Employee
exports.uploadBeforePhoto = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }
    
    // Check if employee is assigned to this job
    if (job.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this job'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No photo uploaded'
      });
    }
    
    // Replace old photos with new photo (delete old ones, add new one)
    const oldPhotos = job.beforePhotos || [];
    
    // Delete old photos from Cloudinary
    if (oldPhotos.length > 0) {
      try {
        await deletePhotos(oldPhotos);
        console.log(`Deleted ${oldPhotos.length} old before photos`);
      } catch (error) {
        console.error('Error deleting old before photos:', error);
        // Continue with upload even if deletion fails
      }
    }
    
    // Save Cloudinary URL instead of local path
    job.beforePhotos = [req.file.secure_url]; // Use Cloudinary secure URL
    
    await job.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Before photo updated successfully',
      data: {
        photoUrl: req.file.secure_url, // Return Cloudinary URL
        publicId: req.file.public_id, // Cloudinary public ID
        oldPhotosReplaced: oldPhotos.length
      }
    });
  } catch (error) {
    console.error('Upload before photo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload before photo'
    });
  }
};

// @desc    Upload after photo
// @route   POST /api/jobs/:id/after-photo
// @access  Employee
exports.uploadAfterPhoto = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }
    
    // Check if employee is assigned to this job
    if (job.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this job'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No photo uploaded'
      });
    }
    
    // Replace old photos with new photo (delete old ones, add new one)
    const oldPhotos = job.afterPhotos || [];
    
    // Delete old photos from Cloudinary
    if (oldPhotos.length > 0) {
      try {
        await deletePhotos(oldPhotos);
        console.log(`Deleted ${oldPhotos.length} old after photos`);
      } catch (error) {
        console.error('Error deleting old after photos:', error);
        // Continue with upload even if deletion fails
      }
    }
    
    // Save Cloudinary URL instead of local path
    job.afterPhotos = [req.file.secure_url]; // Use Cloudinary secure URL
    
    await job.save();
    
    res.status(200).json({
      status: 'success',
      message: 'After photo updated successfully',
      data: {
        photoUrl: req.file.secure_url, // Return Cloudinary URL
        publicId: req.file.public_id, // Cloudinary public ID
        oldPhotosReplaced: oldPhotos.length
      }
    });
  } catch (error) {
    console.error('Upload after photo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload after photo'
    });
  }
};

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Admin
exports.getAllJobs = async (req, res) => {
  try {
    const { status, startDate, endDate, employeeId } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }
    
    const jobs = await Job.find(filter)
      .populate({
        path: 'employeeId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate('customerId', 'name email phone')
      .populate('serviceId')
      .sort({ scheduledDate: -1 });
    
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: { jobs }
    });
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching jobs'
    });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Admin, Employee (own), Customer (own)
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate({
        path: 'employeeId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate('customerId')
      .populate('serviceId')
      .populate('subscriptionId');
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }
    
    // Check access permissions
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      if (job.employeeId._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    } else if (req.user.role === 'customer') {
      if (job.customerId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: { job }
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching job'
    });
  }
};

// @desc    Get my jobs (employee)
// @route   GET /api/jobs/my-jobs
// @access  Employee
exports.getMyJobs = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee profile not found'
      });
    }
    
    const { status } = req.query;
    const filter = { employeeId: employee._id };
    if (status) filter.status = status;
    
    const jobs = await Job.find(filter)
      .populate('customerId', 'name phone address')
      .populate('serviceId')
      .sort({ scheduledDate: -1 });
    
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: { jobs }
    });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching jobs'
    });
  }
};

// @desc    Get today's jobs (employee)
// @route   GET /api/jobs/my-jobs/today
// @access  Employee
exports.getTodayJobs = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee profile not found'
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const jobs = await Job.find({
      employeeId: employee._id,
      scheduledDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'in-progress'] }
    })
      .populate('customerId', 'name phone address')
      .populate('serviceId')
      .sort({ scheduledDate: 1 });
    
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: { jobs }
    });
  } catch (error) {
    console.error('Get today jobs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching today\'s jobs'
    });
  }
};

// @desc    Start job
// @route   PUT /api/jobs/:id/start
// @access  Employee
exports.startJob = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }
    
    if (job.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    job.status = 'in-progress';
    job.startTime = new Date();
    await job.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Job started successfully',
      data: { job }
    });
  } catch (error) {
    console.error('Start job error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error starting job'
    });
  }
};

// @desc    Complete job
// @route   PUT /api/jobs/:id/complete
// @access  Employee
exports.completeJob = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }
    
    if (job.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    // Handle photo uploads
    const beforePhotos = req.files?.beforePhotos?.map(file => file.secure_url) || [];
    const afterPhotos = req.files?.afterPhotos?.map(file => file.secure_url) || [];
    
    job.status = 'completed';
    job.completedDate = new Date();
    job.endTime = new Date();
    job.beforePhotos = beforePhotos;
    job.afterPhotos = afterPhotos;
    job.notes = req.body.notes || null;
    await job.save();
    
    // Update employee stats
    employee.totalJobsCompleted += 1;
    await employee.save();
    
    // Update subscription
    const subscription = await Subscription.findById(job.subscriptionId);
    if (subscription) {
      subscription.completedWashes += 1;
      
      // Calculate next wash date
      const service = await require('../models/Service.model').findById(subscription.serviceId);
      if (service) {
        const nextDate = new Date();
        switch (service.frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        }
        subscription.nextWashDate = nextDate;
      }
      
      await subscription.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Job completed successfully',
      data: { job }
    });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error completing job'
    });
  }
};

// @desc    Cancel job
// @route   PUT /api/jobs/:id/cancel
// @access  Employee
exports.cancelJob = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }
    
    if (job.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    job.status = 'cancelled';
    job.notes = req.body.reason || 'Cancelled by employee';
    await job.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Job cancelled successfully',
      data: { job }
    });
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error cancelling job'
    });
  }
};

// @desc    Get my job history (customer)
// @route   GET /api/jobs/my-history
// @access  Customer
exports.getMyJobHistory = async (req, res) => {
  try {
    const jobs = await Job.find({ customerId: req.user._id })
      .populate({
        path: 'employeeId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate('serviceId')
      .sort({ scheduledDate: -1 });
    
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: { jobs }
    });
  } catch (error) {
    console.error('Get job history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching job history'
    });
  }
};

// @desc    Rate job
// @route   PUT /api/jobs/:id/rate
// @access  Customer
exports.rateJob = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }
    
    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only rate completed jobs'
      });
    }
    
    job.customerRating = rating;
    job.customerFeedback = feedback;
    await job.save();
    
    // Update employee rating
    const employee = await Employee.findById(job.employeeId);
    if (employee) {
      const totalRating = (employee.rating * employee.totalRatings) + rating;
      employee.totalRatings += 1;
      employee.rating = totalRating / employee.totalRatings;
      await employee.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Job rated successfully',
      data: { job }
    });
  } catch (error) {
    console.error('Rate job error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error rating job'
    });
  }
};
