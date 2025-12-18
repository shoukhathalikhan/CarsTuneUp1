const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  submitFeedback,
  getTopFeedback,
  getUserFeedback
} = require('../controllers/feedback.controller');

router.post('/', protect, submitFeedback);
router.get('/top', getTopFeedback);
router.get('/my', protect, getUserFeedback);

module.exports = router;
