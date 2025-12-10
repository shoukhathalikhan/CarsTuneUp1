const Brand = require('../models/Brand.model');
const Service = require('../models/Service.model');
const cloudinary = require('../config/cloudinary');

const ALLOWED_SERVICE_TYPES = ['hatchback-sedan', 'suv-muv'];

const clampPercentage = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return numeric;
};

const normalizeServiceType = (rawType) => {
  if (typeof rawType !== 'string') return null;
  const normalized = rawType.toLowerCase();
  return ALLOWED_SERVICE_TYPES.includes(normalized) ? normalized : null;
};

const buildVehicleTypeFilter = (type) => {
  if (!type) return undefined;
  const normalized = String(type).toLowerCase();
  if (normalized.includes('hatchback')) {
    return { $regex: /^hatchback[\s/-]*sedan$/i };
  }
  if (normalized.includes('suv') || normalized.includes('muv')) {
    return { $regex: /^suv[\s/-]*muv$/i };
  }
  return { $regex: new RegExp(`^${normalized}$`, 'i') };
};

const calculateFinalPrice = (basePrice = 0, percentage = 0) => {
  const price = Number(basePrice) || 0;
  const pct = Number(percentage) || 0;
  return Number((price + (price * pct) / 100).toFixed(2));
};

const buildServicePricing = async (serviceType, pricePercentage) => {
  const services = await Service.find({
    vehicleType: buildVehicleTypeFilter(serviceType),
    isActive: true
  }).select('_id name price');

  if (!services || services.length === 0) {
    throw new Error('No services found for the selected service type. Add services first.');
  }

  return services.map((service) => ({
    serviceId: service._id,
    serviceName: service.name,
    basePrice: service.price,
    finalPrice: calculateFinalPrice(service.price, pricePercentage)
  }));
};

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getAllBrands = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const brands = await Brand.find(filter).sort({ name: 1 });
    
    res.status(200).json({
      status: 'success',
      results: brands.length,
      data: { brands }
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching brands'
    });
  }
};

// @desc    Get brand by ID
// @route   GET /api/brands/:id
// @access  Public
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        status: 'error',
        message: 'Brand not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { brand }
    });
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching brand'
    });
  }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Admin
exports.createBrand = async (req, res) => {
  try {
    const { name, models } = req.body;
    
    // Check if brand already exists
    const existingBrand = await Brand.findOne({ name: name.trim() });
    if (existingBrand) {
      return res.status(400).json({
        status: 'error',
        message: 'Brand already exists'
      });
    }
    
    // Handle logo upload
    let logoUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'brands',
        transformation: [
          { width: 300, height: 300, crop: 'fit' }
        ]
      });
      logoUrl = result.secure_url;
    } else if (req.body.logo) {
      logoUrl = req.body.logo;
    }
    
    if (!logoUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Brand logo is required'
      });
    }
    
    const brand = await Brand.create({
      name: name.trim(),
      logo: logoUrl,
      models: models ? JSON.parse(models) : []
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Brand created successfully',
      data: { brand }
    });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error creating brand'
    });
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Admin
exports.updateBrand = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        status: 'error',
        message: 'Brand not found'
      });
    }
    
    // Handle logo upload if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'brands',
        transformation: [
          { width: 300, height: 300, crop: 'fit' }
        ]
      });
      brand.logo = result.secure_url;
    } else if (req.body.logo) {
      brand.logo = req.body.logo;
    }
    
    if (name) brand.name = name.trim();
    if (isActive !== undefined) brand.isActive = isActive;
    await brand.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Brand updated successfully',
      data: { brand }
    });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating brand'
    });
  }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Admin
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        status: 'error',
        message: 'Brand not found'
      });
    }
    
    await brand.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting brand'
    });
  }
};

// @desc    Add model to brand
// @route   POST /api/brands/:id/models
// @access  Admin
exports.addModel = async (req, res) => {
  try {
    // Debug logging
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Request body values:', req.body);
    console.log('Request file:', req.file);
    
    // Handle FormData from multer - fields come as strings
    let name = req.body?.name || '';
    let pricePercentage = clampPercentage(req.body?.pricePercentage ?? '0');
    let serviceType = normalizeServiceType(req.body?.serviceType);

    console.log('Extracted name:', name);
    console.log('Extracted pricePercentage:', pricePercentage);
    console.log('Name type:', typeof name);
    console.log('Name length:', name.length);

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.log('Name validation failed:', { name, type: typeof name, trimmed: name.trim() });
      return res.status(400).json({
        status: 'error',
        message: 'Model name is required and must be a valid string'
      });
    }

    if (!serviceType) {
      return res.status(400).json({
        status: 'error',
        message: 'Service type is required and must be either hatchback-sedan or suv-muv'
      });
    }

    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        status: 'error',
        message: 'Brand not found'
      });
    }
    
    // Check if model already exists
    const existingModel = brand.models.find(m => m.name.toLowerCase() === name.trim().toLowerCase());
    if (existingModel) {
      return res.status(400).json({
        status: 'error',
        message: 'Model already exists for this brand'
      });
    }
    
    let modelImage = '';
    
    // Upload image to Cloudinary if provided (using CloudinaryStorage pattern)
    if (req.file) {
      try {
        modelImage = req.file.secure_url || req.file.path || '';
        console.log('Image uploaded successfully:', modelImage);
        console.log('Cloudinary secure_url:', req.file.secure_url);
        console.log('Cloudinary path:', req.file.path);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          status: 'error',
          message: 'Error uploading image'
        });
      }
    }
    
    let servicePricing;
    try {
      servicePricing = await buildServicePricing(serviceType, pricePercentage);
    } catch (pricingError) {
      console.error('Service pricing build error:', pricingError);
      return res.status(400).json({
        status: 'error',
        message: pricingError.message || 'Failed to load base services for the selected type'
      });
    }
    
    brand.models.push({ 
      name: name.trim(),
      image: modelImage,
      pricePercentage,
      serviceType,
      servicePricing
    });
    await brand.save();
    
    console.log('Model added successfully');
    res.status(201).json({
      status: 'success',
      message: 'Model added successfully',
      data: { brand }
    });
  } catch (error) {
    console.error('Add model error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error adding model',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update model
// @route   PUT /api/brands/:id/models/:modelId
// @access  Admin
exports.updateModel = async (req, res) => {
  try {
    // Debug logging
    console.log('UpdateModel Request body keys:', Object.keys(req.body || {}));
    console.log('UpdateModel Request body values:', req.body);
    console.log('UpdateModel Request file:', req.file);
    
    // Handle FormData from multer - fields come as strings
    let name = req.body?.name || '';
    let isActive = req.body?.isActive === 'true' || req.body?.isActive === true;
    const rawPercentage = req.body?.pricePercentage ?? undefined;
    const rawServiceType = req.body?.serviceType;
    let pricePercentage = rawPercentage !== undefined
      ? clampPercentage(rawPercentage)
      : undefined;
    let serviceTypeInput = rawServiceType !== undefined
      ? normalizeServiceType(rawServiceType)
      : undefined;

    if (rawServiceType !== undefined && !serviceTypeInput) {
      return res.status(400).json({
        status: 'error',
        message: 'Service type must be either hatchback-sedan or suv-muv'
      });
    }

    console.log('Extracted update data:', { name, isActive, pricePercentage, serviceType: serviceTypeInput });
    
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        status: 'error',
        message: 'Brand not found'
      });
    }
    
    const model = brand.models.id(req.params.modelId);
    if (!model) {
      return res.status(404).json({
        status: 'error',
        message: 'Model not found'
      });
    }
    
    // Update model fields
    if (name && typeof name === 'string' && name.trim() !== '') {
      model.name = name.trim();
    }
    
    if (typeof isActive === 'boolean') {
      model.isActive = isActive;
    }
    
    let shouldRecalculatePricing = false;

    if (pricePercentage !== undefined && pricePercentage !== model.pricePercentage) {
      model.pricePercentage = pricePercentage;
      shouldRecalculatePricing = true;
    }

    if (serviceTypeInput && serviceTypeInput !== model.serviceType) {
      model.serviceType = serviceTypeInput;
      shouldRecalculatePricing = true;
    }

    if (!model.servicePricing || model.servicePricing.length === 0) {
      shouldRecalculatePricing = true;
    }
    
    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        // With CloudinaryStorage, the URL is available in req.file.secure_url
        model.image = req.file.secure_url || req.file.path || '';
        console.log('UpdateModel Image uploaded successfully:', model.image);
        console.log('Cloudinary secure_url:', req.file.secure_url);
        console.log('Cloudinary path:', req.file.path);
      } catch (uploadError) {
        console.error('UpdateModel Image upload error:', uploadError);
        return res.status(500).json({
          status: 'error',
          message: 'Error uploading image'
        });
      }
    }
    
    if (shouldRecalculatePricing) {
      try {
        model.servicePricing = await buildServicePricing(
          model.serviceType || 'hatchback-sedan',
          model.pricePercentage || 0
        );
      } catch (pricingError) {
        console.error('UpdateModel service pricing error:', pricingError);
        return res.status(400).json({
          status: 'error',
          message: pricingError.message || 'Failed to refresh service pricing for this model'
        });
      }
    }
    
    await brand.save();
    
    console.log('Model updated successfully');
    res.status(200).json({
      status: 'success',
      message: 'Model updated successfully',
      data: { brand }
    });
  } catch (error) {
    console.error('Update model error:', error);
    console.error('UpdateModel error stack:', error.stack);
    console.error('UpdateModel error message:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating model',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Delete model
// @route   DELETE /api/brands/:id/models/:modelId
// @access  Admin
exports.deleteModel = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        status: 'error',
        message: 'Brand not found'
      });
    }
    
    brand.models.pull(req.params.modelId);
    await brand.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Model deleted successfully',
      data: { brand }
    });
  } catch (error) {
    console.error('Delete model error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting model'
    });
  }
};
