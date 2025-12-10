const mongoose = require('mongoose');
const User = require('./models/User.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Checking employee accounts...');
  
  const employees = await User.find({ role: 'employee' })
    .select('name email role isActive')
    .lean();
  
  console.log('\n📋 Available Employee Accounts:');
  console.log('═══════════════════════════════════════════');
  
  employees.forEach((emp, index) => {
    console.log(`${index + 1}. ${emp.name}`);
    console.log(`   Email: ${emp.email}`);
    console.log(`   Role: ${emp.role}`);
    console.log(`   Status: ${emp.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   Default Password: employee123`);
    console.log('   ─────────────────────────────────────');
  });
  
  if (employees.length === 0) {
    console.log('❌ No employee accounts found in database');
  } else {
    console.log(`✅ Found ${employees.length} employee account(s)`);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Check complete');
})
.catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
