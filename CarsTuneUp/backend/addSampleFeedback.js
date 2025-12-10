const mongoose = require('mongoose');
const Feedback = require('./models/Feedback.model');
const User = require('./models/User.model');
require('dotenv').config();

async function addSampleFeedback() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const sampleFeedbacks = [
      {
        rating: 5,
        feedback: 'Excellent service! The car wash was thorough and the staff was very professional. My car looks brand new!'
      },
      {
        rating: 4,
        feedback: 'Great experience overall. Quick service and good quality. Would definitely recommend to friends.'
      },
      {
        rating: 5,
        feedback: 'Amazing attention to detail. They cleaned every corner of my car. Very impressed with the service.'
      },
      {
        rating: 4,
        feedback: 'Professional team and great results. The interior cleaning was exceptional. Will come back again.'
      },
      {
        rating: 5,
        feedback: 'Best car wash service in the city! Friendly staff, affordable prices, and outstanding quality.'
      },
      {
        rating: 3,
        feedback: 'Good service but took longer than expected. Quality was good though. Overall satisfied.'
      },
      {
        rating: 5,
        feedback: 'Outstanding service from start to finish. The team is professional and the results speak for themselves.'
      },
      {
        rating: 4,
        feedback: 'Very satisfied with the service. My car looks amazing and the price was reasonable.'
      },
      {
        rating: 5,
        feedback: 'Exceptional service! They went above and beyond. My car has never looked this clean.'
      },
      {
        rating: 4,
        feedback: 'Great value for money. Professional service and excellent results. Highly recommended!'
      }
    ];

    const testUser = await User.findOne({ role: 'customer' });
    if (!testUser) {
      console.log('❌ No customer user found for testing');
      process.exit(1);
    }

    console.log(`🧪 Adding sample feedback for user: ${testUser.name}\n`);

    for (let i = 0; i < sampleFeedbacks.length; i++) {
      const feedback = sampleFeedbacks[i];
      
      // Create a unique user name for variety
      const userNames = ['Alex Johnson', 'Sarah Williams', 'Mike Chen', 'Emma Davis', 'John Smith', 
                        'Lisa Anderson', 'David Brown', 'Maria Garcia', 'James Wilson', 'Jennifer Lee'];
      
      const newFeedback = await Feedback.create({
        userId: testUser._id,
        userName: userNames[i],
        userEmail: testUser.email,
        rating: feedback.rating,
        feedback: feedback.feedback,
        isPublic: true
      });

      console.log(`✅ Feedback ${i + 1} created:`);
      console.log(`   User: ${newFeedback.userName}`);
      console.log(`   Rating: ${newFeedback.rating}/5`);
      console.log(`   Feedback: ${newFeedback.feedback.substring(0, 50)}...`);
      console.log('');
    }

    console.log('🎉 All sample feedback created successfully!');
    console.log('\n📊 Total feedback entries in database:');
    const totalFeedback = await Feedback.countDocuments();
    console.log(`   ${totalFeedback} feedback entries`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addSampleFeedback();
