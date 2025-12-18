const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin routes
router.post('/', authenticate, authorize('admin'), employeeController.createEmployee);
router.get('/', authenticate, authorize('admin'), employeeController.getAllEmployees);
router.get('/:id', authenticate, authorize('admin'), employeeController.getEmployeeById);
router.put('/:id', authenticate, authorize('admin'), employeeController.updateEmployee);
router.delete('/:id', authenticate, authorize('admin'), employeeController.deleteEmployee);

// Employee routes
router.get('/me/profile', authenticate, authorize('employee'), employeeController.getMyProfile);
router.put('/me/availability', authenticate, authorize('employee'), employeeController.updateAvailability);

module.exports = router;
