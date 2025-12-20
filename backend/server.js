const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const os = require('os');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const serviceRoutes = require('./routes/service.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const employeeRoutes = require('./routes/employee.routes');
const jobRoutes = require('./routes/job.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const brandRoutes = require('./routes/brand.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const chatRoutes = require('./routes/chat.routes');
const addonRoutes = require('./routes/addon.routes');

// Import automation services
const { assignJobsAutomatically, sendUpcomingWashNotifications } = require('./services/automation.service');

// Initialize Express app
const app = express();

// Middleware - Allow all origins for mobile apps
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or Expo Go)
    if (!origin) return callback(null, true);
    
    // Allow all origins for mobile app compatibility
    return callback(null, true);
  },
  credentials: true
}));

// Serve static files for uploaded photos
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env file');
  console.error('📝 Please add: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
  process.exit(1);
}

// Database connection (removed deprecated options)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('bad auth')) {
      console.error('🔑 Authentication failed. Please check:');
      console.error('   1. Username and password in MONGODB_URI are correct');
      console.error('   2. User exists in Database Access (MongoDB Atlas)');
      console.error('   3. User has proper permissions (readWrite or higher)');
      console.error('   4. Password special characters are URL-encoded');
    }
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/addons', addonRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CarsTuneUp API is running',
    timestamp: new Date().toISOString()
  });
});

// Cron Jobs - Run automation tasks
// Run job assignment every day at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('🤖 Running automated job assignment...');
  await assignJobsAutomatically();
});

// Send notifications for upcoming washes every day at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('📲 Sending upcoming wash notifications...');
  await sendUpcomingWashNotifications();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

const getLocalIp = () => {
  if (process.env.EXTERNAL_IP) {
    return process.env.EXTERNAL_IP;
  }

  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal && net.address !== '127.0.0.1') {
        return net.address;
      }
    }
  }

  return 'localhost';
};

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
const ACCESS_IP = getLocalIp();

app.listen(PORT, HOST, () => {
  console.log(`🚀 CarsTuneUp Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Accessible at http://${ACCESS_IP}:${PORT}`);
});

module.exports = app;
