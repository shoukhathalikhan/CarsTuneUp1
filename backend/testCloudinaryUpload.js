const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const Employee = require('./models/Employee.model');
const User = require('./models/User.model');
const Service = require('./models/Service.model');
const { assignJobToBestEmployee } = require('./services/smartEmployeeAssignment');
require('dotenv').config();

async function testCloudinaryUpload() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('✅ Connected to MongoDB\n');

    // Check Cloudinary configuration
    console.log('🔍 Checking Cloudinary Configuration:');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing'}`);
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'}\n`);

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('❌ Cloudinary is not properly configured. Please set the environment variables:');
      console.log('   - CLOUDINARY_CLOUD_NAME');
      console.log('   - CLOUDINARY_API_KEY');
      console.log('   - CLOUDINARY_API_SECRET');
      process.exit(1);
    }

    // Create a test job
    const today = new Date();
    console.log(`🧪 Creating test job for Cloudinary upload test\n`);

    const testCustomer = await User.findOne({ role: 'customer' });
    const testService = await Service.findOne();

    if (!testCustomer || !testService) {
      console.log('❌ Could not find test customer or service');
      process.exit(1);
    }

    const result = await assignJobToBestEmployee({
      scheduledDate: today,
      customerId: testCustomer._id,
      serviceId: testService._id,
      subscriptionId: null,
      location: { 
        address: testCustomer.address?.street || 'Test Address',
        city: testCustomer.address?.city || 'Test City'
      }
    });

    console.log(`✅ Test job created!`);
    console.log(`   Job ID: ${result.job._id}`);
    console.log(`   Employee: ${result.assignedEmployee.userId?.name || result.assignedEmployee.employeeId}`);

    // Test Cloudinary URL format
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📸 Testing Cloudinary URL Format:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Simulate what would happen with a Cloudinary upload
    const mockCloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v${Date.now()}/carstuneup/jobs/test_job_${result.job._id}.jpg`;
    
    console.log(`Example Cloudinary URL: ${mockCloudinaryUrl}`);
    
    // Test the URL parsing
    const { deleteCloudinaryPhotos } = require('./utils/photoUtils');
    const parseTest = await deleteCloudinaryPhotos([mockCloudinaryUrl]);
    
    console.log(`Parsed Public ID: ${parseTest[0].publicId}`);
    console.log(`URL Valid: ${parseTest[0].deleted ? '✅' : '❌'}`);

    // Clean up test job
    await Job.findByIdAndDelete(result.job._id);
    console.log(`\n🧹 Test job cleaned up`);

    console.log('\n✅ Cloudinary Upload Test Complete!');
    console.log('\n📋 What to test next:');
    console.log('1. Upload a before photo via the employee app');
    console.log('2. Upload an after photo via the employee app');
    console.log('3. Check that the URLs are Cloudinary URLs (not local paths)');
    console.log('4. Verify images appear in customer app and employee app');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCloudinaryUpload();
