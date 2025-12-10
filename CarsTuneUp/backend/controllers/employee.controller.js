const Employee = require('../models/Employee.model');
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

// @desc    Create new employee
// @route   POST /api/employees
// @access  Admin
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, phone, area, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'employee123', 10);

    // Create user account
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: 'employee',
      isActive: true
    });

    // Generate unique employee ID
    const employeeId = 'EMP' + Date.now();

    // Create employee profile
    const employee = await Employee.create({
      userId: user._id,
      employeeId,
      area: area.trim(),
      isAvailable: true,
      assignedJobsToday: 0,
      totalJobsCompleted: 0,
      rating: 5.0,
      dailyLimit: 6
    });

    // Populate user data
    await employee.populate('userId', 'name email phone');

    res.status(201).json({
      status: 'success',
      message: 'Employee created successfully',
      data: { 
        employee,
        defaultPassword: password || 'employee123'
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error creating employee'
    });
  }
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Admin
exports.getAllEmployees = async (req, res) => {
  try {
    const { area, isAvailable } = req.query;
    
    const filter = {};
    if (area) filter.area = area;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    
    const employees = await Employee.find(filter)
      .populate('userId', 'name email phone profileImage')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: employees.length,
      data: { employees }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching employees'
    });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Admin
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'name email phone profileImage address');
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { employee }
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching employee'
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Admin
exports.updateEmployee = async (req, res) => {
  try {
    const { area, dailyLimit, isAvailable, workingDays } = req.body;
    
    const updateData = {};
    if (area) updateData.area = area;
    if (dailyLimit) updateData.dailyLimit = dailyLimit;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (workingDays) updateData.workingDays = workingDays;
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId');
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Employee updated successfully',
      data: { employee }
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating employee'
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Admin
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }
    
    const userId = employee.userId;
    
    // Delete employee profile
    await Employee.findByIdAndDelete(req.params.id);
    
    // Delete user account completely
    await User.findByIdAndDelete(userId);
    
    // Note: Jobs assigned to this employee will remain in the database
    // but can be reassigned to other employees
    
    res.status(200).json({
      status: 'success',
      message: 'Employee and associated user account deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting employee'
    });
  }
};

// @desc    Get my employee profile
// @route   GET /api/employees/me/profile
// @access  Employee
exports.getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone profileImage address');
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee profile not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { employee }
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching profile'
    });
  }
};

// @desc    Update availability
// @route   PUT /api/employees/me/availability
// @access  Employee
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const employee = await Employee.findOneAndUpdate(
      { userId: req.user._id },
      { isAvailable },
      { new: true }
    ).populate('userId');
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee profile not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Availability updated successfully',
      data: { employee }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating availability'
    });
  }
};
