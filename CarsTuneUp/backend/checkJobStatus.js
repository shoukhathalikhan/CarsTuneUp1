const mongoose = require('mongoose');
const Job = require('./models/Job.model');
require('dotenv').config();

async function checkJobStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const job = await Job.findById('6925d30772c7a7d40f456634');
    if (job) {
      console.log('📋 Job Status:');
      console.log('   ID:', job._id);
      console.log('   Status:', job.status);
      console.log('   Before Photos:', job.beforePhotos.length);
      console.log('   After Photos:', job.afterPhotos.length);
      
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

      if (job.beforePhotos.length === 0 && job.afterPhotos.length === 0) {
        console.log('\n📝 No photos uploaded yet. Ready for testing!');
        console.log('\n🧪 Test from Employee App:');
        console.log('1. Login as an employee');
        console.log('2. Find the test job (ID: 6925d30772c7a7d40f456634)');
        console.log('3. Upload a before photo');
        console.log('4. Upload an after photo');
        console.log('5. Check that URLs are Cloudinary URLs');
      }
    } else {
      console.log('❌ Job not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkJobStatus();
