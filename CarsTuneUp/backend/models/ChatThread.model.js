const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  lastMessage: {
    type: String,
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  customerUnreadCount: {
    type: Number,
    default: 0
  },
  adminUnreadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

chatThreadSchema.index({ customerId: 1, adminId: 1 }, { unique: true });

module.exports = mongoose.model('ChatThread', chatThreadSchema);
