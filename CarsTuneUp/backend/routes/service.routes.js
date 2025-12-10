const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/public/reviews', serviceController.getRecentReviews);
router.get('/:id/overview', serviceController.getServiceOverview);
router.get('/:id', serviceController.getServiceById);

// Admin only routes
router.post('/', authenticate, authorize('admin'), upload.single('serviceImage'), serviceController.createService);
router.put('/:id', authenticate, authorize('admin'), upload.single('serviceImage'), serviceController.updateService);
router.delete('/:id', authenticate, authorize('admin'), serviceController.deleteService);

module.exports = router;
