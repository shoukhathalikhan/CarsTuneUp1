const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: false
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  beforePhotos: [{
    type: String
  }],
  afterPhotos: [{
    type: String
  }],
  notes: {
    type: String,
    default: null
  },
  customerRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  customerFeedback: {
    type: String,
    default: null
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
jobSchema.index({ employeeId: 1, scheduledDate: 1 });
jobSchema.index({ customerId: 1, status: 1 });
jobSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('Job', jobSchema);
