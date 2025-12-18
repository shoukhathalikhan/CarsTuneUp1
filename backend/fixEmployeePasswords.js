const mongoose = require('mongoose');
const User = require('./models/User.model');
const Employee = require('./models/Employee.model');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔧 Fixing employee passwords...');
  
  try {
    // Find all employees
    const employees = await Employee.find({}).populate('userId');
    
    console.log(`📋 Found ${employees.length} employees to fix:`);
    
    const correctPassword = 'employee123';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);
    
    console.log(`🔑 Using password: "${correctPassword}"`);
    console.log(`🔐 Hashed password: ${hashedPassword.substring(0, 20)}...`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const employee of employees) {
      if (!employee.userId) {
        console.log(`❌ Employee ${employee.employeeId} has no user record - SKIPPING`);
        skippedCount++;
        continue;
      }
      
      const user = employee.userId;
      
      // Check if password is already set and correct
      if (user.password) {
        const isCurrentCorrect = await bcrypt.compare(correctPassword, user.password);
        if (isCurrentCorrect) {
          console.log(`✅ ${user.name} (${user.email}) - Password already correct`);
          skippedCount++;
          continue;
        }
      }
      
      // Update password
      await User.findByIdAndUpdate(user._id, { password: hashedPassword });
      
      console.log(`🔧 Fixed: ${user.name} (${user.email})`);
      console.log(`   Employee ID: ${employee.employeeId}`);
      console.log(`   Password set to: "${correctPassword}"`);
      
      fixedCount++;
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Fixed: ${fixedCount} employees`);
    console.log(`   Skipped: ${skippedCount} employees`);
    console.log(`   Total: ${employees.length} employees`);
    
    // Test login for the most recently created employee
    const latestEmployee = employees[employees.length - 1];
    if (latestEmployee && latestEmployee.userId) {
      console.log('\n🧪 Testing login for latest employee:');
      console.log(`   Email: ${latestEmployee.userId.email}`);
      console.log(`   Password: ${correctPassword}`);
      
      const testLogin = await bcrypt.compare(correctPassword, hashedPassword);
      console.log(`   Password verification: ${testLogin ? 'SUCCESS ✅' : 'FAILED ❌'}`);
      
      // Verify the password was saved correctly
      const updatedUser = await User.findById(latestEmployee.userId._id);
      const savedPasswordCheck = await bcrypt.compare(correctPassword, updatedUser.password);
      console.log(`   Saved password check: ${savedPasswordCheck ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    }
    
    console.log('\n🎯 Employee Login Credentials:');
    employees.forEach((emp, index) => {
      if (emp.userId) {
        console.log(`${index + 1}. Email: ${emp.userId.email}, Password: ${correctPassword}`);
      }
    });
    
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
