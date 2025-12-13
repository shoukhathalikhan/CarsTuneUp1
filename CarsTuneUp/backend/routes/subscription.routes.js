const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Customer routes
router.post('/', authenticate, authorize('customer'), subscriptionController.createSubscription);
router.get('/my-subscriptions', authenticate, authorize('customer'), subscriptionController.getMySubscriptions);
router.put('/:id/cancel', authenticate, authorize('customer'), subscriptionController.cancelSubscription);

// Admin routes
router.get('/', authenticate, authorize('admin'), subscriptionController.getAllSubscriptions);
router.get('/pending', authenticate, authorize('admin'), subscriptionController.getPendingSubscriptions);
router.post('/admin/regenerate-all-schedules', authenticate, authorize('admin'), subscriptionController.regenerateAllSchedules);
router.put('/:id/assign-employee', authenticate, authorize('admin'), subscriptionController.assignEmployee);
router.get('/:id', authenticate, authorize('admin', 'customer'), subscriptionController.getSubscriptionById);

module.exports = router;
