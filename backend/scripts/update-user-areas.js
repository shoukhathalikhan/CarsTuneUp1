const mongoose = require('mongoose');
const User = require('../models/User.model');
require('dotenv').config();

const updateUserAreas = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({
      role: 'customer',
      $or: [
        { area: { $exists: false } },
        { area: null },
        { area: '' },
        { area: 'N/A' }
      ]
    });

    console.log(`Found ${users.length} users with missing area field`);

    let updated = 0;
    for (const user of users) {
      let areaValue = null;

      if (user.address && user.address.city) {
        areaValue = `${user.address.city}${user.address.state ? ', ' + user.address.state : ''}`;
      } else if (user.addresses && user.addresses.length > 0) {
        const primaryAddress = user.addresses.find(addr => addr.isPrimary) || user.addresses[0];
        if (primaryAddress && primaryAddress.city) {
          areaValue = `${primaryAddress.city}${primaryAddress.state ? ', ' + primaryAddress.state : ''}`;
        }
      }

      if (areaValue) {
        user.area = areaValue;
        await user.save();
        updated++;
        console.log(`Updated user ${user.email}: ${areaValue}`);
      }
    }

    console.log(`\nSuccessfully updated ${updated} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating user areas:', error);
    process.exit(1);
  }
};

updateUserAreas();
