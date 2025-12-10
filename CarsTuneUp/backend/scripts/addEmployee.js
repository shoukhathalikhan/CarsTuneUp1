const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');
const User = require('../models/User.model');
const Employee = require('../models/Employee.model');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Generate employee ID
const generateEmployeeId = () => {
  const prefix = 'EMP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Main function to add employee
async function addEmployee() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get employee details from user
    console.log('📝 Enter Employee Details:\n');
    
    const name = await question('Name: ');
    const email = await question('Email: ');
    const phone = await question('Phone: ');
    const password = await question('Password (min 6 characters): ');
    const area = await question('Service Area (e.g., Jayanagar, Koramangala): ');
    const dailyLimit = await question('Daily Job Limit (default 6): ') || '6';

    // Validate inputs
    if (!name || !email || !phone || !password || !area) {
      console.log('\n❌ Error: All fields are required!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('\n❌ Error: Password must be at least 6 characters!');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('\n❌ Error: User with this email already exists!');
      process.exit(1);
    }

    // Create user account
    console.log('\n🔄 Creating employee account...');
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: password,
      role: 'employee',
      area: area.trim(),
      isActive: true
    });

    // Create employee profile
    const employeeId = generateEmployeeId();
    const employee = await Employee.create({
      userId: user._id,
      employeeId: employeeId,
      area: area.trim(),
      dailyLimit: parseInt(dailyLimit),
      isAvailable: true,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      assignedJobsToday: 0,
      totalJobsCompleted: 0,
      rating: 5.0,
      totalRatings: 0
    });

    console.log('\n✅ Employee created successfully!\n');
    console.log('📋 Employee Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Employee ID: ${employeeId}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Area: ${employee.area}`);
    console.log(`Daily Limit: ${employee.dailyLimit} jobs`);
    console.log(`Status: Active`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔐 Login Credentials:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error creating employee:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('👋 Database connection closed.');
    process.exit(0);
  }
}

// Run the script
console.log('═══════════════════════════════════════════');
console.log('    CarsTuneUp - Add Employee Script');
console.log('═══════════════════════════════════════════\n');

addEmployee();
