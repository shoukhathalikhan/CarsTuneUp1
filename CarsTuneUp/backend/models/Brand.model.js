const mongoose = require('mongoose');

const servicePricingSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  finalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const modelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  pricePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  serviceType: {
    type: String,
    enum: ['hatchback-sedan', 'suv-muv'],
    default: 'hatchback-sedan'
  },
  servicePricing: {
    type: [servicePricingSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true
  },
  logo: {
    type: String,
    required: [true, 'Brand logo is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  models: [modelSchema]
}, {
  timestamps: true
});

// Index for efficient queries
brandSchema.index({ name: 1 });
brandSchema.index({ isActive: 1 });

module.exports = mongoose.model('Brand', brandSchema);
