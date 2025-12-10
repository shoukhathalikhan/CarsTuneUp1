const User = require('../models/User.model');
const Brand = require('../models/Brand.model');

const ALLOWED_SERVICE_TYPES = ['hatchback-sedan', 'suv-muv'];

const normalizeVehicleType = (rawType) => {
  if (!rawType || typeof rawType !== 'string') {
    return 'hatchback-sedan';
  }
  const normalized = rawType.toLowerCase();
  return ALLOWED_SERVICE_TYPES.find((type) => normalized.includes(type.split('-')[0]))
    || (normalized.includes('suv') || normalized.includes('muv') ? 'suv-muv' : 'hatchback-sedan');
};

const resolveModelServiceType = async (brandName, modelName, fallbackType) => {
  try {
    if (!brandName || !modelName) {
      return normalizeVehicleType(fallbackType);
    }

    const brand = await Brand.findOne({ name: brandName, isActive: true }).lean();
    if (!brand || !Array.isArray(brand.models)) {
      return normalizeVehicleType(fallbackType);
    }

    const model = brand.models.find(
      (entry) => entry?.name?.toLowerCase() === String(modelName).toLowerCase()
    );

    if (model?.serviceType) {
      return normalizeVehicleType(model.serviceType);
    }

    return normalizeVehicleType(fallbackType);
  } catch (error) {
    console.error('Error resolving service type for vehicle:', error);
    return normalizeVehicleType(fallbackType);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      status: 'success',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, area, vehicle } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) {
      // Handle both string and object formats
      updateData.address = typeof address === 'string' ? JSON.parse(address) : address;
    }
    if (area) updateData.area = area;
    if (vehicle) {
      // Handle vehicle data
      updateData.vehicle = typeof vehicle === 'string' ? JSON.parse(vehicle) : vehicle;
    }
    if (req.file) updateData.profileImage = req.file.path;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current and new password'
      });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error changing password'
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const users = await User.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user'
    });
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'User status updated successfully',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user status'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user'
    });
  }
};

// @desc    Update FCM token for push notifications
// @route   POST /api/users/fcm-token
// @access  Private
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({
        status: 'error',
        message: 'FCM token is required'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fcmToken },
      { new: true }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'FCM token updated successfully',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating FCM token'
    });
  }
};

// Vehicle management methods
exports.getVehicles = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    let hasTypeUpdates = false;

    await Promise.all(
      (user.vehicles || []).map(async (vehicle) => {
        const resolvedType = await resolveModelServiceType(
          vehicle.brand,
          vehicle.model,
          vehicle.type
        );

        if (resolvedType !== vehicle.type) {
          vehicle.type = resolvedType;
          hasTypeUpdates = true;
        }
      })
    );

    if (hasTypeUpdates) {
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      data: { vehicles: user.vehicles || [] }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching vehicles'
    });
  }
};

exports.addVehicle = async (req, res) => {
  try {
    const { brand, model, type, year, color, licensePlate } = req.body;
    
    const user = await User.findById(req.user._id);
    const resolvedType = await resolveModelServiceType(brand, model, type);
    const newVehicle = {
      id: Date.now().toString(),
      brand,
      model,
      type: resolvedType,
      year: year || new Date().getFullYear(),
      color,
      licensePlate,
      createdAt: new Date()
    };
    
    user.vehicles = user.vehicles || [];
    user.vehicles.push(newVehicle);
    await user.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Vehicle added successfully',
      data: { vehicle: newVehicle }
    });
  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding vehicle'
    });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { brand, model, type, year, color, licensePlate } = req.body;
    const vehicleId = req.params.id;
    
    const user = await User.findById(req.user._id);
    const vehicle = user.vehicles.id(vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found'
      });
    }
    
    const nextBrand = brand || vehicle.brand;
    const nextModel = model || vehicle.model;
    const shouldRecalculateType = Boolean(brand || model || type);

    if (shouldRecalculateType) {
      vehicle.type = await resolveModelServiceType(nextBrand, nextModel, type || vehicle.type);
    }

    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;
    if (year) vehicle.year = year;
    if (color) vehicle.color = color;
    if (licensePlate) vehicle.licensePlate = licensePlate;
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Vehicle updated successfully',
      data: { vehicle }
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating vehicle'
    });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    
    const user = await User.findById(req.user._id);
    user.vehicles = user.vehicles.filter(vehicle => vehicle.id !== vehicleId);
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting vehicle'
    });
  }
};

// Address management methods
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addresses = user.addresses || [];
    
    // If no addresses but user has primary address, add it
    if (addresses.length === 0 && user.address) {
      addresses.push({
        id: 'primary-address',
        label: user.address.city || 'Home',
        ...user.address,
        isPrimary: true
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { addresses }
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching addresses'
    });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, landmark, label } = req.body;
    
    const user = await User.findById(req.user._id);
    const newAddress = {
      id: Date.now().toString(),
      street,
      city,
      state,
      zipCode,
      landmark,
      label: label || city,
      createdAt: new Date()
    };
    
    user.addresses = user.addresses || [];
    user.addresses.push(newAddress);
    await user.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Address added successfully',
      data: { address: newAddress }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding address'
    });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, landmark, label } = req.body;
    const addressId = req.params.id;
    
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }
    
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (landmark) address.landmark = landmark;
    if (label) address.label = label;
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Address updated successfully',
      data: { address }
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating address'
    });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(address => address.id !== addressId);
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting address'
    });
  }
};
