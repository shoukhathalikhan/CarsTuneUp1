const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin only routes
router.get('/dashboard', authenticate, authorize('admin'), analyticsController.getDashboardStats);
router.get('/revenue', authenticate, authorize('admin'), analyticsController.getRevenueStats);
router.get('/employee-performance', authenticate, authorize('admin'), analyticsController.getEmployeePerformance);

module.exports = router;
