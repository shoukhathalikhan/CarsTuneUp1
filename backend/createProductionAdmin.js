const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: '.env.production' });

async function createProductionAdmin() {
  try {
    console.log('🔌 Connecting to Production MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Production MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@carztuneupp.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists in production database');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@carztuneupp.com',
      password: 'Admin@123',
      phone: '9999999999',
      role: 'admin',
      isActive: true,
      address: {
        street: 'Admin Street',
        city: 'Admin City',
        state: 'Admin State',
        pincode: '000000',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@123');
    console.log('👤 Name:', admin.name);
    console.log('🆔 ID:', admin._id);
    console.log('\n🎉 You can now login to the admin dashboard!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createProductionAdmin();
