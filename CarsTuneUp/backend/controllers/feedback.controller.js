const Feedback = require('../models/Feedback.model');
const User = require('../models/User.model');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private (Customer)
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!rating || !feedback) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating and feedback are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Create feedback
    const newFeedback = await Feedback.create({
      userId,
      userName: user.name,
      userEmail: user.email,
      rating,
      feedback: feedback.trim()
    });

    res.status(201).json({
      status: 'success',
      message: 'Feedback submitted successfully',
      data: {
        feedback: newFeedback
      }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit feedback'
    });
  }
};

// @desc    Get top 10 feedback entries
// @route   GET /api/feedback/top
// @access  Public
exports.getTopFeedback = async (req, res) => {
  try {
    const topFeedback = await Feedback.find({ isPublic: true })
      .sort({ createdAt: -1, rating: -1 })
      .limit(10)
      .select('userName rating feedback createdAt')
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        feedback: topFeedback
      }
    });
  } catch (error) {
    console.error('Get top feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch feedback'
    });
  }
};

// @desc    Get user's feedback history
// @route   GET /api/feedback/my
// @access  Private
exports.getUserFeedback = async (req, res) => {
  try {
    const userFeedback = await Feedback.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('rating feedback createdAt');

    res.status(200).json({
      status: 'success',
      data: {
        feedback: userFeedback
      }
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user feedback'
    });
  }
};
