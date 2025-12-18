const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  startDate: {
    type: Date,
    required: false,
    default: null
  },
  endDate: {
    type: Date,
    required: true
  },
  nextWashDate: {
    type: Date,
    required: false,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'cancelled', 'expired'],
    default: 'pending'
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  completedWashes: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ nextWashDate: 1, status: 1 });
subscriptionSchema.index({ assignedEmployee: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
