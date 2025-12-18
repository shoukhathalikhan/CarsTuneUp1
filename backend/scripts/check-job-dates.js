require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job.model');
const Employee = require('../models/Employee.model');
const User = require('../models/User.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const jobs = await Job.find()
      .populate('employeeId', 'employeeId')
      .populate('customerId', 'name')
      .sort({ scheduledDate: 1 })
      .limit(15);
    
    console.log(`📋 First ${jobs.length} jobs by date:\n`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    jobs.forEach((job, index) => {
      const jobDate = new Date(job.scheduledDate);
      const isToday = jobDate.toDateString() === today.toDateString();
      const dayLabel = isToday ? '(TODAY)' : '';
      
      console.log(`${index + 1}. ${jobDate.toDateString()} ${dayLabel}`);
      console.log(`   Customer: ${job.customerId?.name || 'N/A'}`);
      console.log(`   Employee: ${job.employeeId?.employeeId || 'N/A'}`);
      console.log(`   Status: ${job.status}\n`);
    });
    
    const todayJobs = jobs.filter(j => {
      const jobDate = new Date(j.scheduledDate);
      return jobDate.toDateString() === today.toDateString();
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Jobs: ${jobs.length}`);
    console.log(`   Jobs Today: ${todayJobs.length}`);
    console.log(`   Today's Date: ${today.toDateString()}\n`);
    
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
