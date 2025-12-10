const mongoose = require('mongoose');
const User = require('./models/User.model');
require('dotenv').config();

async function findUserCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'zaibasaniya@gmail.com' });
    
    if (user) {
      console.log('✅ User found:');
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Role:', user.role);
      console.log('   Phone:', user.phone);
      console.log('   Account created:', user.createdAt);
      console.log('\n🔐 Password Information:');
      console.log('   The password is hashed in the database for security.');
      console.log('   Common default passwords for customers:');
      console.log('   - customer123');
      console.log('   - Customer@123');
      console.log('   - 123456');
      console.log('   - password');
      console.log('\n💡 Try these passwords to login:');
      console.log('   1. customer123');
      console.log('   2. Customer@123');
      console.log('   3. 123456');
      console.log('   4. password');
    } else {
      console.log('❌ User not found with email: zaibasaniya@gmail.com');
      
      // Let's check all customers to see if there's a similar email
      const customers = await User.find({ role: 'customer' }).select('email name');
      console.log('\n📋 Available customer accounts:');
      customers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.email} (${customer.name})`);
      });
      
      // Check for similar email addresses
      const similarUser = await User.findOne({ 
        email: { $regex: 'zaiba', $options: 'i' },
        role: 'customer'
      });
      
      if (similarUser) {
        console.log('\n🔍 Found similar user:');
        console.log('   Email:', similarUser.email);
        console.log('   Name:', similarUser.name);
        console.log('   Try the common passwords listed above');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

findUserCredentials();
