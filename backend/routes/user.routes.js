const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// User routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, upload.single('profileImage'), userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);
router.post('/fcm-token', authenticate, userController.updateFcmToken);

// Vehicle routes
router.get('/vehicles', authenticate, userController.getVehicles);
router.post('/vehicles', authenticate, userController.addVehicle);
router.put('/vehicles/:id', authenticate, userController.updateVehicle);
router.delete('/vehicles/:id', authenticate, userController.deleteVehicle);

// Address routes
router.get('/addresses', authenticate, userController.getAddresses);
router.post('/addresses', authenticate, userController.addAddress);
router.put('/addresses/:id', authenticate, userController.updateAddress);
router.delete('/addresses/:id', authenticate, userController.deleteAddress);

// Admin routes
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);
router.get('/:id', authenticate, authorize('admin'), userController.getUserById);
router.put('/:id/status', authenticate, authorize('admin'), userController.updateUserStatus);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;
