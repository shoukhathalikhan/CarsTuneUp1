const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  role: {
    type: String,
    enum: ['customer', 'employee', 'admin'],
    default: 'customer'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    landmark: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  vehicle: {
    brand: String,
    model: String
  },
  vehicles: [{
    id: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['hatchback-sedan', 'suv-muv'],
      default: 'hatchback-sedan'
    },
    year: Number,
    color: String,
    licensePlate: String,
    isArchived: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  addresses: [{
    id: {
      type: String,
      required: true
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    landmark: String,
    label: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  area: {
    type: String,
    trim: true
  },
  fcmToken: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String,
    default: null
  },
  isProfileSetupComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-populate area from address
userSchema.pre('save', function(next) {
  if (this.isModified('address') || this.isModified('addresses')) {
    if (!this.area || this.area === 'N/A') {
      if (this.address && this.address.city) {
        this.area = `${this.address.city}${this.address.state ? ', ' + this.address.state : ''}`;
      } else if (this.addresses && this.addresses.length > 0) {
        const primaryAddress = this.addresses.find(addr => addr.isPrimary) || this.addresses[0];
        if (primaryAddress && primaryAddress.city) {
          this.area = `${primaryAddress.city}${primaryAddress.state ? ', ' + primaryAddress.state : ''}`;
        }
      }
    }
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
