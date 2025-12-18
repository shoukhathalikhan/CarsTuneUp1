require('dotenv').config();
const mongoose = require('mongoose');
const { getEmployeeStats } = require('../services/automation.service');

console.log('📊 CarsTuneUp - Employee Assignment Statistics\n');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('📈 Fetching employee statistics...\n');
    return getEmployeeStats();
  })
  .then((result) => {
    console.log('✅ Employee Statistics Retrieved!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Employee-Customer Assignment Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    result.data.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.name} (${emp.employeeId})`);
      console.log(`   Capacity: ${emp.capacity} customers`);
      if (emp.customers.length > 0) {
        console.log(`   Assigned Customers:`);
        emp.customers.forEach((customer, i) => {
          console.log(`      ${i + 1}. ${customer}`);
        });
      } else {
        console.log(`   No customers assigned yet`);
      }
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Employees: ${result.totalEmployees}`);
    console.log(`Max Customers per Employee: 6\n`);
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fetching statistics:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });
