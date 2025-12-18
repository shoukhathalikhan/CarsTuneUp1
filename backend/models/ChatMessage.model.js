const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatThread',
    required: true,
    index: true
  },
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
  senderRole: {
    type: String,
    enum: ['customer', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['message', 'complaint'],
    default: 'message'
  },
  seenByAdmin: {
    type: Boolean,
    default: false
  },
  seenByCustomer: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

chatMessageSchema.index({ threadId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
