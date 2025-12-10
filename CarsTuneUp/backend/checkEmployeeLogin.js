const mongoose = require('mongoose');
const User = require('./models/User.model');
const Employee = require('./models/Employee.model');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carstuneup')
.then(async () => {
  console.log('🔍 Checking employee login issue...');
  
  try {
    // Find all employees
    const employees = await Employee.find({}).populate('userId');
    
    console.log(`📋 Found ${employees.length} employees:`);
    console.log('═══════════════════════════════════════════');
    
    for (const employee of employees) {
      console.log(`\n👨‍💼 Employee: ${employee.userId?.name || 'Unknown'}`);
      console.log(`   Email: ${employee.userId?.email || 'N/A'}`);
      console.log(`   Employee ID: ${employee.employeeId}`);
      console.log(`   User ID: ${employee.userId?._id}`);
      console.log(`   Status: ${employee.status}`);
      console.log(`   Created: ${employee.createdAt}`);
      
      if (employee.userId) {
        // Test password verification
        const testPassword = 'employee123';
        const userPassword = employee.userId.password;
        
        if (!userPassword) {
          console.log(`   Password: NOT SET ❌`);
        } else {
          const isPasswordCorrect = await bcrypt.compare(testPassword, userPassword);
          console.log(`   Password "employee123" matches: ${isPasswordCorrect ? 'YES ✅' : 'NO ❌'}`);
          
          // Show password hash (first few chars)
          console.log(`   Password hash: ${userPassword.substring(0, 20)}...`);
          
          // Test login manually
          try {
            const isMatch = await employee.userId.comparePassword(testPassword);
            console.log(`   Built-in comparePassword: ${isMatch ? 'YES ✅' : 'NO ❌'}`);
          } catch (error) {
            console.log(`   Built-in comparePassword error: ${error.message}`);
          }
        }
      }
    }
    
    // Check if there are any recent employees
    const recentEmployees = employees.filter(emp => {
      const createdAt = new Date(emp.createdAt);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return createdAt > oneHourAgo;
    });
    
    if (recentEmployees.length > 0) {
      console.log(`\n🆕 Recent employees (last hour): ${recentEmployees.length}`);
      for (const emp of recentEmployees) {
        console.log(`   - ${emp.userId?.name} (${emp.userId?.email}) - Created ${new Date(emp.createdAt).toLocaleString()}`);
      }
    }
    
    // Try to create a test employee with known password
    console.log('\n🔧 Creating test employee with known password...');
    
    const testEmail = 'testemployee@cars.com';
    const testPassword = 'employee123';
    
    // Check if test employee already exists
    const existingTestUser = await User.findOne({ email: testEmail });
    if (existingTestUser) {
      console.log('   Test employee already exists, deleting...');
      await User.deleteOne({ _id: existingTestUser._id });
      await Employee.deleteOne({ userId: existingTestUser._id });
    }
    
    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    
    console.log(`   Manual hash: ${hashedPassword.substring(0, 20)}...`);
    
    // Create test user
    const testUser = await User.create({
      name: 'Test Employee',
      email: testEmail,
      password: hashedPassword,
      role: 'employee',
      phone: '1234567890'
    });
    
    // Create test employee
    const testEmployee = await Employee.create({
      userId: testUser._id,
      employeeId: 'EMP001',
      status: 'active'
    });
    
    console.log('✅ Test employee created successfully!');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Employee ID: ${testEmployee.employeeId}`);
    
    // Test login with test employee
    const testLogin = await bcrypt.compare(testPassword, testUser.password);
    console.log(`   Test login verification: ${testLogin ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    
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
