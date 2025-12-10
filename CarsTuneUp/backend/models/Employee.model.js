const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  area: {
    type: String,
    required: [true, 'Service area is required'],
    trim: true
  },
  maxCustomers: {
    type: Number,
    default: 6,
    min: 1,
    max: 10
  },
  dailyJobLimit: {
    type: Number,
    default: 6,
    min: 1,
    max: 10
  },
  assignedCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedJobsToday: {
    type: Number,
    default: 0
  },
  totalJobsCompleted: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  joinDate: {
    type: Date,
    default: Date.now
  },
  vehicleDetails: {
    type: String,
    default: null
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Reset daily job count at midnight
employeeSchema.methods.resetDailyJobs = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastReset = new Date(this.lastResetDate);
  lastReset.setHours(0, 0, 0, 0);
  
  if (today > lastReset) {
    this.assignedJobsToday = 0;
    this.lastResetDate = new Date();
    return this.save();
  }
};

// Check if employee can take more customers
employeeSchema.methods.canTakeCustomer = function() {
  return this.isAvailable && this.assignedCustomers.length < this.maxCustomers;
};

// Check if employee can take more jobs today
employeeSchema.methods.canTakeJob = function() {
  return this.isAvailable && this.assignedJobsToday < this.maxCustomers;
};

module.exports = mongoose.model('Employee', employeeSchema);
