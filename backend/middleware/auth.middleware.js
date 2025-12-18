const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // If token is expired, try to use refresh token from header
      if (error.name === 'TokenExpiredError') {
        const refreshToken = req.headers['x-refresh-token'];
        
        if (!refreshToken) {
          return res.status(401).json({
            status: 'error',
            message: 'Token expired. Please refresh your token.'
          });
        }

        try {
          decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
          
          // Verify refresh token in database
          const user = await User.findById(decoded.id);
          if (!user || user.refreshToken !== refreshToken || !user.isActive) {
            return res.status(401).json({
              status: 'error',
              message: 'Invalid refresh token.'
            });
          }

          // Generate new access token
          const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '7d'
          });

          // Attach new token to response header
          res.setHeader('x-new-token', newToken);
          req.user = user;
          return next();
        } catch (refreshError) {
          console.error('Refresh token error:', refreshError);
          return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired refresh token.'
          });
        }
      }
      throw error;
    }
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token or user not found.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token.'
    });
  }
};

// Check if user has required role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Alias for backward compatibility
exports.authenticate = exports.protect;
