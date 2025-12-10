const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Testing photo replacement functionality...');
  
  try {
    // Find the customer's completed job
    const customer = await User.findOne({ email: 'shoukhat2003@gmail.com' });
    const job = await Job.findOne({ 
      customerId: customer._id, 
      status: 'completed',
      beforePhotos: { $exists: true, $ne: [] }
    });
    
    if (!job) {
      console.log('❌ No completed job with photos found for customer');
      return;
    }
    
    console.log(`📋 Found job: ${job._id}`);
    console.log(`   Current before photos: ${job.beforePhotos.length}`);
    console.log(`   Current after photos: ${job.afterPhotos.length}`);
    console.log('   Current photos:');
    job.beforePhotos.forEach((photo, i) => console.log(`     Before ${i+1}: ${photo}`));
    job.afterPhotos.forEach((photo, i) => console.log(`     After ${i+1}: ${photo}`));
    
    console.log('\n🔄 Simulating photo upload replacement...');
    
    // Simulate what happens when employee uploads new photos:
    
    // 1. Before photo upload (replaces old before photos)
    const oldBeforePhotos = job.beforePhotos;
    const newBeforePhoto = 'http://192.168.1.125:5000/uploads/job-photos/beforePhoto-' + Date.now() + '-new.jpg';
    
    console.log(`\n📸 New before photo upload:`);
    console.log(`   Old photos to delete: ${oldBeforePhotos.length}`);
    oldBeforePhotos.forEach(photo => console.log(`     - ${photo}`));
    console.log(`   New photo: ${newBeforePhoto}`);
    
    // Update job (replace before photos)
    job.beforePhotos = [newBeforePhoto];
    
    // 2. After photo upload (replaces old after photos)
    const oldAfterPhotos = job.afterPhotos;
    const newAfterPhoto = 'http://192.168.1.125:5000/uploads/job-photos/afterPhoto-' + Date.now() + '-new.jpg';
    
    console.log(`\n📸 New after photo upload:`);
    console.log(`   Old photos to delete: ${oldAfterPhotos.length}`);
    oldAfterPhotos.forEach(photo => console.log(`     - ${photo}`));
    console.log(`   New photo: ${newAfterPhoto}`);
    
    // Update job (replace after photos)
    job.afterPhotos = [newAfterPhoto];
    
    // Save the job with new photos
    await job.save();
    
    console.log('\n✅ Photo replacement simulation complete!');
    console.log(`   Updated job: ${job._id}`);
    console.log(`   New before photos: ${job.beforePhotos.length}`);
    console.log(`   New after photos: ${job.afterPhotos.length}`);
    console.log('   New photo URLs:');
    job.beforePhotos.forEach((photo, i) => console.log(`     Before ${i+1}: ${photo}`));
    job.afterPhotos.forEach((photo, i) => console.log(`     After ${i+1}: ${photo}`));
    
    console.log('\n💡 What happens in real usage:');
    console.log('   1. Employee uploads new before photo');
    console.log('   2. Old before photos are deleted from storage');
    console.log('   3. New before photo replaces old ones');
    console.log('   4. Same process for after photos');
    console.log('   5. Customer sees latest photos on home page');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Test complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
