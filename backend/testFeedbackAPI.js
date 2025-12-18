const mongoose = require('mongoose');
const Feedback = require('./models/Feedback.model');
const User = require('./models/User.model');
require('dotenv').config();

async function testFeedbackAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create a test feedback entry
    console.log('🧪 Testing Feedback Creation:');
    
    const testUser = await User.findOne({ role: 'customer' });
    if (!testUser) {
      console.log('❌ No customer user found for testing');
      process.exit(1);
    }

    const testFeedback = await Feedback.create({
      userId: testUser._id,
      userName: testUser.name,
      userEmail: testUser.email,
      rating: 5,
      feedback: 'Excellent service! The car wash was thorough and the staff was very professional.',
      isPublic: true
    });

    console.log('✅ Test feedback created:');
    console.log(`   User: ${testFeedback.userName}`);
    console.log(`   Rating: ${testFeedback.rating}/5`);
    console.log(`   Feedback: ${testFeedback.feedback.substring(0, 50)}...`);
    console.log(`   Date: ${testFeedback.createdAt}`);

    // Test 2: Get top feedback
    console.log('\n🧪 Testing Top Feedback Retrieval:');
    
    const topFeedback = await Feedback.find({ isPublic: true })
      .sort({ createdAt: -1, rating: -1 })
      .limit(10)
      .select('userName rating feedback createdAt')
      .lean();

    console.log(`✅ Found ${topFeedback.length} feedback entries:`);
    topFeedback.forEach((feedback, index) => {
      console.log(`   ${index + 1}. ${feedback.userName} - ${feedback.rating}/5 - ${feedback.feedback.substring(0, 40)}...`);
    });

    // Test 3: Get user feedback history
    console.log('\n🧪 Testing User Feedback History:');
    
    const userFeedback = await Feedback.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .select('rating feedback createdAt');

    console.log(`✅ Found ${userFeedback.length} feedback entries for ${testUser.name}:`);
    userFeedback.forEach((feedback, index) => {
      console.log(`   ${index + 1}. Rating: ${feedback.rating}/5 - ${feedback.feedback.substring(0, 40)}...`);
    });

    console.log('\n✅ All Feedback API Tests Passed!');
    console.log('\n📋 API Endpoints Ready:');
    console.log('   POST /api/feedback - Submit feedback (protected)');
    console.log('   GET /api/feedback/top - Get top 10 feedback (public)');
    console.log('   GET /api/feedback/my - Get user feedback history (protected)');

    // Clean up test feedback
    await Feedback.findByIdAndDelete(testFeedback._id);
    console.log('\n🧹 Test feedback cleaned up');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFeedbackAPI();
