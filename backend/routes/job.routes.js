const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadJobPhotos } = require('../middleware/cloudinaryStorage');
const { getEmployeeStats, assignIndividualJob } = require('../services/automation.service');

// Employee routes
router.get('/my-jobs', authenticate, authorize('employee'), jobController.getMyJobs);
router.get('/my-jobs/today', authenticate, authorize('employee'), jobController.getTodayJobs);
router.put('/:id/start', authenticate, authorize('employee'), jobController.startJob);
router.put('/:id/start-with-photos', authenticate, authorize('employee'), uploadJobPhotos.fields([
  { name: 'beforePhotos', maxCount: 5 }
]), jobController.startJobWithPhotos);
router.post('/:id/before-photo', authenticate, authorize('employee'), jobController.uploadBeforePhotoMiddleware, jobController.uploadBeforePhoto);
router.post('/:id/after-photo', authenticate, authorize('employee'), jobController.uploadAfterPhotoMiddleware, jobController.uploadAfterPhoto);
router.put('/:id/complete', authenticate, authorize('employee'), uploadJobPhotos.fields([
  { name: 'afterPhotos', maxCount: 5 }
]), jobController.completeJob);
router.put('/:id/cancel', authenticate, authorize('employee'), jobController.cancelJob);

// Customer routes
router.get('/my-history', authenticate, authorize('customer'), jobController.getMyJobHistory);
router.get('/recent-works', authenticate, authorize('customer'), jobController.getRecentWorks);
router.put('/:id/rate', authenticate, authorize('customer'), jobController.rateJob);

// Individual job booking (for immediate bookings)
router.post('/book', authenticate, authorize('customer'), async (req, res) => {
  try {
    const { serviceId, scheduledDate, location } = req.body;
    
    if (!serviceId || !scheduledDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Service ID and scheduled date are required'
      });
    }

    // Convert scheduledDate to Date object
    const jobDate = new Date(scheduledDate);
    if (isNaN(jobDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid scheduled date'
      });
    }

    // Assign job using smart assignment
    const result = await assignIndividualJob(
      req.user._id,
      serviceId,
      jobDate,
      location || {}
    );

    res.status(201).json({
      status: 'success',
      message: 'Job booked successfully',
      data: {
        job: result.job,
        assignedEmployee: {
          name: result.assignedEmployee.userId?.name || result.assignedEmployee.employeeId,
          employeeId: result.assignedEmployee.employeeId
        }
      }
    });
  } catch (error) {
    console.error('Book job error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error booking job'
    });
  }
});

// Admin routes
router.get('/', authenticate, authorize('admin'), jobController.getAllJobs);
router.get('/:id', authenticate, authorize('admin', 'employee', 'customer'), jobController.getJobById);
router.get('/stats/employees', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await getEmployeeStats();
    res.status(200).json({
      status: 'success',
      message: 'Employee statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get employee statistics'
    });
  }
});

module.exports = router;
