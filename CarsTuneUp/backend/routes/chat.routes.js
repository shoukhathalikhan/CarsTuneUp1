const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post('/customer/send', authenticate, authorize('customer'), chatController.sendCustomerMessage);
router.get('/customer/thread', authenticate, authorize('customer'), chatController.getMyChatThread);

router.get('/admin/threads', authenticate, authorize('admin'), chatController.getAdminThreads);
router.post('/admin/:threadId/reply', authenticate, authorize('admin'), chatController.replyAsAdmin);

router.get('/:threadId/messages', authenticate, authorize('admin', 'customer'), chatController.getThreadMessages);
router.put('/:threadId/seen', authenticate, authorize('admin', 'customer'), chatController.markThreadSeen);

module.exports = router;
