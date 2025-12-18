const Addon = require('../models/Addon.model');

exports.createAddon = async (req, res) => {
  try {
    const { name, price, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and price are required'
      });
    }

    const addon = await Addon.create({
      name,
      price,
      description,
      imageURL: req.file ? req.file.path : null,
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      message: 'Addon created successfully',
      data: { addon }
    });
  } catch (error) {
    console.error('Create addon error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create addon',
      error: error.message
    });
  }
};

exports.getAllAddons = async (req, res) => {
  try {
    const addons = await Addon.find({ isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { addons }
    });
  } catch (error) {
    console.error('Get addons error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch addons',
      error: error.message
    });
  }
};

exports.getAddonById = async (req, res) => {
  try {
    const { id } = req.params;
    const addon = await Addon.findById(id);

    if (!addon) {
      return res.status(404).json({
        status: 'error',
        message: 'Addon not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { addon }
    });
  } catch (error) {
    console.error('Get addon error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch addon',
      error: error.message
    });
  }
};

exports.updateAddon = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, isActive } = req.body;

    const addon = await Addon.findById(id);

    if (!addon) {
      return res.status(404).json({
        status: 'error',
        message: 'Addon not found'
      });
    }

    if (name !== undefined) addon.name = name;
    if (price !== undefined) addon.price = price;
    if (description !== undefined) addon.description = description;
    if (isActive !== undefined) addon.isActive = isActive;
    if (req.file) addon.imageURL = req.file.path;

    await addon.save();

    res.status(200).json({
      status: 'success',
      message: 'Addon updated successfully',
      data: { addon }
    });
  } catch (error) {
    console.error('Update addon error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update addon',
      error: error.message
    });
  }
};

exports.deleteAddon = async (req, res) => {
  try {
    const { id } = req.params;

    const addon = await Addon.findByIdAndDelete(id);

    if (!addon) {
      return res.status(404).json({
        status: 'error',
        message: 'Addon not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Addon deleted successfully'
    });
  } catch (error) {
    console.error('Delete addon error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete addon',
      error: error.message
    });
  }
};
