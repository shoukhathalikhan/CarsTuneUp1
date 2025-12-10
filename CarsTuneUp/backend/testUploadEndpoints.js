const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const Employee = require('./models/Employee.model');
const User = require('./models/User.model');
const Service = require('./models/Service.model');
const { assignJobToBestEmployee } = require('./services/smartEmployeeAssignment');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testUploadEndpoints() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup');
    console.log('✅ Connected to MongoDB\n');

    // Create a test job
    const today = new Date();
    console.log(`🧪 Creating test job for upload testing\n`);

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

    // Check current job state
    const job = await Job.findById(result.job._id);
    console.log('\n📋 Current Job State:');
    console.log(`   Before Photos: ${job.beforePhotos.length} photos`);
    console.log(`   After Photos: ${job.afterPhotos.length} photos`);
    console.log(`   Status: ${job.status}`);

    if (job.beforePhotos.length > 0) {
      console.log('\n📸 Before Photos:');
      job.beforePhotos.forEach((photo, index) => {
        console.log(`   ${index + 1}. ${photo}`);
        console.log(`      Type: ${photo.includes('cloudinary.com') ? 'Cloudinary ✅' : 'Local ❌'}`);
      });
    }

    if (job.afterPhotos.length > 0) {
      console.log('\n📸 After Photos:');
      job.afterPhotos.forEach((photo, index) => {
        console.log(`   ${index + 1}. ${photo}`);
        console.log(`      Type: ${photo.includes('cloudinary.com') ? 'Cloudinary ✅' : 'Local ❌'}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Upload Endpoints Ready:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   POST /api/jobs/${result.job._id}/before-photo`);
    console.log(`   POST /api/jobs/${result.job._id}/after-photo`);
    console.log(`   PUT /api/jobs/${result.job._id}/complete (with multiple photos)`);
    
    console.log('\n📋 Test Instructions:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Use the employee app to upload photos for this job');
    console.log('3. Check the database to verify Cloudinary URLs are saved');
    console.log('4. Verify images display correctly in both apps');

    // Keep the job for testing (don't delete it)
    console.log(`\n💾 Test job ${result.job._id} kept for upload testing`);
    console.log('   Use this job ID to test the upload endpoints');

    console.log('\n✅ Upload Endpoint Test Complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testUploadEndpoints();
