const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);

// Admin routes
router.post('/', protect, authorize('admin'), upload.single('logo'), brandController.createBrand);
router.put('/:id', protect, authorize('admin'), upload.single('logo'), brandController.updateBrand);
router.delete('/:id', protect, authorize('admin'), brandController.deleteBrand);

// Model management routes
router.post('/:id/models', protect, authorize('admin'), upload.single('image'), brandController.addModel);
router.put('/:id/models/:modelId', protect, authorize('admin'), upload.single('image'), brandController.updateModel);
router.delete('/:id/models/:modelId', protect, authorize('admin'), brandController.deleteModel);

module.exports = router;
