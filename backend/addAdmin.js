const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User.model');

dotenv.config();

const addAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@carztuneupp.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
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
        zipCode: '000000'
      }
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@carztuneupp.com');
    console.log('🔐 Password: Admin@123');
    console.log('👤 Role: admin');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

addAdmin();
