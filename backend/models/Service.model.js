const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: 0
  },
  frequency: {
    type: String,
    enum: ['daily', '2-days-once', '3-days-once', 'weekly-once', 'one-time'],
    required: [true, 'Service frequency is required']
  },
  duration: {
    type: Number,
    default: 30,
    comment: 'Duration in minutes'
  },
  imageURL: {
    type: String,
    default: null
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['basic', 'premium', 'deluxe'],
    default: 'basic'
  },
  vehicleType: {
    type: String,
    enum: ['hatchback-sedan', 'suv-muv'],
    default: 'hatchback-sedan'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
