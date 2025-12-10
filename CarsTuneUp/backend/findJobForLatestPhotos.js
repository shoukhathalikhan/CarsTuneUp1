const mongoose = require('mongoose');
const Job = require('./models/Job.model');
const User = require('./models/User.model');
const Service = require('./models/Service.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Finding job for latest uploaded photos...');
  
  try {
    // Find the customer
    const customer = await User.findOne({ email: 'shoukhat2003@gmail.com' });
    
    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }
    
    console.log(`👤 Customer: ${customer.name} (${customer.email})`);
    
    // Latest photo files uploaded today
    const latestPhotos = [
      'beforePhoto-1764065919360-682145462.jpg', // 3:48 PM
      'afterPhoto-1764065940611-191883232.jpg',   // 3:49 PM
    ];
    
    console.log('\n📸 Latest uploaded photos:');
    latestPhotos.forEach(photo => console.log(`   - ${photo}`));
    
    // Find jobs completed around the time these photos were uploaded (3:48-3:49 PM today)
    const targetTime = new Date('2025-11-25T15:48:00');
    const endTime = new Date('2025-11-25T15:55:00');
    
    console.log(`\n🔍 Looking for jobs completed between ${targetTime.toLocaleString()} and ${endTime.toLocaleString()}...`);
    
    const recentJobs = await Job.find({
      customerId: customer._id,
      status: 'completed',
      completedDate: {
        $gte: targetTime,
        $lte: endTime
      }
    }).populate('serviceId', 'name');
    
    console.log(`\n📋 Found ${recentJobs.length} jobs completed during that time:`);
    
    if (recentJobs.length === 0) {
      console.log('❌ No jobs found completed during photo upload time');
      
      // Let's check the most recent completed job
      const mostRecentJob = await Job.findOne({ 
        customerId: customer._id, 
        status: 'completed' 
      }).populate('serviceId', 'name')
      .sort({ completedDate: -1 });
      
      if (mostRecentJob) {
        console.log(`\n🎯 Most recent completed job:`);
        console.log(`   Job ID: ${mostRecentJob._id}`);
        console.log(`   Service: ${mostRecentJob.serviceId?.name}`);
        console.log(`   Completed: ${new Date(mostRecentJob.completedDate).toLocaleString()}`);
        console.log(`   Before Photos: ${mostRecentJob.beforePhotos?.length || 0}`);
        console.log(`   After Photos: ${mostRecentJob.afterPhotos?.length || 0}`);
        
        // This job should have the latest photos - let's update it
        console.log(`\n🔄 Updating this job with latest photos...`);
        
        const photoBaseUrl = 'http://192.168.1.125:5000/uploads/job-photos/';
        
        await Job.findByIdAndUpdate(mostRecentJob._id, {
          beforePhotos: [photoBaseUrl + latestPhotos[0]],
          afterPhotos: [photoBaseUrl + latestPhotos[1]]
        });
        
        console.log('✅ Job updated with latest photos!');
        
        // Verify the update
        const updatedJob = await Job.findById(mostRecentJob._id);
        console.log(`   New before photos: ${updatedJob.beforePhotos.length}`);
        console.log(`   New after photos: ${updatedJob.afterPhotos.length}`);
        console.log(`   Should display: ${updatedJob.beforePhotos.length > 0 && updatedJob.afterPhotos.length > 0 ? 'YES ✅' : 'NO ❌'}`);
      }
    } else {
      recentJobs.forEach((job, index) => {
        console.log(`${index + 1}. Job ID: ${job._id}`);
        console.log(`   Service: ${job.serviceId?.name}`);
        console.log(`   Completed: ${new Date(job.completedDate).toLocaleString()}`);
        console.log(`   Before Photos: ${job.beforePhotos?.length || 0}`);
        console.log(`   After Photos: ${job.afterPhotos?.length || 0}`);
        
        if (job.beforePhotos?.length === 0 && job.afterPhotos?.length === 0) {
          console.log(`   ⚠️  This job should have the latest photos!`);
          
          // Update this job with the latest photos
          const photoBaseUrl = 'http://192.168.1.125:5000/uploads/job-photos/';
          
          Job.findByIdAndUpdate(job._id, {
            beforePhotos: [photoBaseUrl + latestPhotos[0]],
            afterPhotos: [photoBaseUrl + latestPhotos[1]]
          }).then(() => {
            console.log(`   ✅ Updated job ${job._id} with latest photos`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
