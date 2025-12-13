const ChatThread = require('../models/ChatThread.model');
const ChatMessage = require('../models/ChatMessage.model');
const User = require('../models/User.model');
const { writeThreadSnapshot, writeMessageSnapshot } = require('../services/chatRealtime.service');

const getDefaultAdmin = async () => {
  return User.findOne({ role: 'admin', isActive: true }).select('_id name email');
};

exports.sendCustomerMessage = async (req, res) => {
  try {
    const { message, type } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required'
      });
    }

    const adminUser = await getDefaultAdmin();
    if (!adminUser) {
      return res.status(500).json({
        status: 'error',
        message: 'No admin available'
      });
    }

    const thread = await ChatThread.findOneAndUpdate(
      { customerId: req.user._id, adminId: adminUser._id },
      {
        $setOnInsert: {
          customerId: req.user._id,
          adminId: adminUser._id,
        },
      },
      { new: true, upsert: true }
    );

    const msgDoc = await ChatMessage.create({
      threadId: thread._id,
      customerId: req.user._id,
      adminId: adminUser._id,
      senderRole: 'customer',
      message: message.trim(),
      type: type === 'complaint' ? 'complaint' : 'message',
      seenByAdmin: false,
      seenByCustomer: true,
    });

    thread.lastMessage = msgDoc.message;
    thread.lastMessageAt = msgDoc.createdAt;
    thread.adminUnreadCount = (thread.adminUnreadCount || 0) + 1;
    thread.customerUnreadCount = 0;
    await thread.save();

    await writeThreadSnapshot(thread._id.toString(), {
      customerId: thread.customerId.toString(),
      adminId: thread.adminId.toString(),
      lastMessage: thread.lastMessage,
      lastMessageAt: thread.lastMessageAt,
      adminUnreadCount: thread.adminUnreadCount,
      customerUnreadCount: thread.customerUnreadCount,
      updatedAt: new Date().toISOString(),
    });

    await writeMessageSnapshot(thread._id.toString(), msgDoc._id.toString(), {
      threadId: thread._id.toString(),
      customerId: msgDoc.customerId.toString(),
      adminId: msgDoc.adminId.toString(),
      senderRole: msgDoc.senderRole,
      message: msgDoc.message,
      type: msgDoc.type,
      seenByAdmin: msgDoc.seenByAdmin,
      seenByCustomer: msgDoc.seenByCustomer,
      createdAt: msgDoc.createdAt,
    });

    return res.status(201).json({
      status: 'success',
      data: {
        thread,
        message: msgDoc,
      }
    });
  } catch (error) {
    console.error('Send customer message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error sending message'
    });
  }
};

exports.getMyChatThread = async (req, res) => {
  try {
    const thread = await ChatThread.findOne({ customerId: req.user._id })
      .populate('adminId', 'name email')
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      status: 'success',
      data: { thread }
    });
  } catch (error) {
    console.error('Get my chat thread error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching chat thread'
    });
  }
};

exports.getAdminThreads = async (req, res) => {
  try {
    const threads = await ChatThread.find({ adminId: req.user._id })
      .populate('customerId', 'name email phone')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    return res.status(200).json({
      status: 'success',
      results: threads.length,
      data: { threads }
    });
  } catch (error) {
    console.error('Get admin threads error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching threads'
    });
  }
};

exports.getThreadMessages = async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        status: 'error',
        message: 'Thread not found'
      });
    }

    if (req.user.role === 'customer' && thread.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    if (req.user.role === 'admin' && thread.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const messages = await ChatMessage.find({ threadId })
      .sort({ createdAt: 1 });

    return res.status(200).json({
      status: 'success',
      results: messages.length,
      data: { messages }
    });
  } catch (error) {
    console.error('Get thread messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching messages'
    });
  }
};

exports.replyAsAdmin = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required'
      });
    }

    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        status: 'error',
        message: 'Thread not found'
      });
    }

    if (thread.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const msgDoc = await ChatMessage.create({
      threadId: thread._id,
      customerId: thread.customerId,
      adminId: thread.adminId,
      senderRole: 'admin',
      message: message.trim(),
      type: 'message',
      seenByAdmin: true,
      seenByCustomer: false,
    });

    thread.lastMessage = msgDoc.message;
    thread.lastMessageAt = msgDoc.createdAt;
    thread.customerUnreadCount = (thread.customerUnreadCount || 0) + 1;
    thread.adminUnreadCount = 0;
    await thread.save();

    await writeThreadSnapshot(thread._id.toString(), {
      customerId: thread.customerId.toString(),
      adminId: thread.adminId.toString(),
      lastMessage: thread.lastMessage,
      lastMessageAt: thread.lastMessageAt,
      adminUnreadCount: thread.adminUnreadCount,
      customerUnreadCount: thread.customerUnreadCount,
      updatedAt: new Date().toISOString(),
    });

    await writeMessageSnapshot(thread._id.toString(), msgDoc._id.toString(), {
      threadId: thread._id.toString(),
      customerId: msgDoc.customerId.toString(),
      adminId: msgDoc.adminId.toString(),
      senderRole: msgDoc.senderRole,
      message: msgDoc.message,
      type: msgDoc.type,
      seenByAdmin: msgDoc.seenByAdmin,
      seenByCustomer: msgDoc.seenByCustomer,
      createdAt: msgDoc.createdAt,
    });

    return res.status(201).json({
      status: 'success',
      data: { message: msgDoc }
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error sending reply'
    });
  }
};

exports.markThreadSeen = async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        status: 'error',
        message: 'Thread not found'
      });
    }

    if (req.user.role === 'customer') {
      if (thread.customerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      await ChatMessage.updateMany(
        { threadId, senderRole: 'admin', seenByCustomer: false },
        { $set: { seenByCustomer: true } }
      );

      thread.customerUnreadCount = 0;
      await thread.save();
    } else if (req.user.role === 'admin') {
      if (thread.adminId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      await ChatMessage.updateMany(
        { threadId, senderRole: 'customer', seenByAdmin: false },
        { $set: { seenByAdmin: true } }
      );

      thread.adminUnreadCount = 0;
      await thread.save();
    }

    await writeThreadSnapshot(thread._id.toString(), {
      adminUnreadCount: thread.adminUnreadCount,
      customerUnreadCount: thread.customerUnreadCount,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      status: 'success',
      data: { thread }
    });
  } catch (error) {
    console.error('Mark thread seen error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error marking thread seen'
    });
  }
};
