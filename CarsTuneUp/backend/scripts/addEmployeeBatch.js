const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User.model');
const Employee = require('../models/Employee.model');

// Load environment variables
dotenv.config();

// Generate employee ID
const generateEmployeeId = () => {
  const prefix = 'EMP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Sample employees to add
const sampleEmployees = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@carstuneup.com',
    phone: '9876543210',
    password: 'employee123',
    area: 'Jayanagar',
    dailyLimit: 6
  },
  {
    name: 'Priya Sharma',
    email: 'priya@carstuneup.com',
    phone: '9876543211',
    password: 'employee123',
    area: 'Koramangala',
    dailyLimit: 6
  },
  {
    name: 'Amit Patel',
    email: 'amit@carstuneup.com',
    phone: '9876543212',
    password: 'employee123',
    area: 'Indiranagar',
    dailyLimit: 6
  }
];

// Main function to add employees
async function addEmployees() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════');
    console.log('    Adding Sample Employees');
    console.log('═══════════════════════════════════════════\n');

    const results = [];

    for (const empData of sampleEmployees) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: empData.email.toLowerCase() });
        if (existingUser) {
          console.log(`⚠️  Skipping ${empData.name} - Email already exists`);
          continue;
        }

        // Create user account
        const user = await User.create({
          name: empData.name,
          email: empData.email.toLowerCase(),
          phone: empData.phone,
          password: empData.password,
          role: 'employee',
          area: empData.area,
          isActive: true
        });

        // Create employee profile
        const employeeId = generateEmployeeId();
        const employee = await Employee.create({
          userId: user._id,
          employeeId: employeeId,
          area: empData.area,
          dailyLimit: empData.dailyLimit,
          isAvailable: true,
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          assignedJobsToday: 0,
          totalJobsCompleted: 0,
          rating: 5.0,
          totalRatings: 0
        });

        results.push({
          employeeId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          area: employee.area,
          password: empData.password
        });

        console.log(`✅ Created: ${user.name} (${employeeId})`);
      } catch (error) {
        console.log(`❌ Error creating ${empData.name}: ${error.message}`);
      }
    }

    // Display summary
    console.log('\n═══════════════════════════════════════════');
    console.log('    Employee Credentials Summary');
    console.log('═══════════════════════════════════════════\n');

    if (results.length === 0) {
      console.log('❌ No employees were created.');
    } else {
      results.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.name}`);
        console.log(`   Employee ID: ${emp.employeeId}`);
        console.log(`   Email: ${emp.email}`);
        console.log(`   Password: ${emp.password}`);
        console.log(`   Phone: ${emp.phone}`);
        console.log(`   Area: ${emp.area}`);
        console.log('   ─────────────────────────────────────\n');
      });

      console.log(`✅ Successfully created ${results.length} employee(s)!\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed.');
    process.exit(0);
  }
}

// Run the script
addEmployees();
