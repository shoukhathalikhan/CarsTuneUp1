const Service = require('../models/Service.model');
const Job = require('../models/Job.model');
const Brand = require('../models/Brand.model');

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

const DEFAULT_FEATURES = [
  'Exterior Foam Wash',
  'Interior Vacuum Cleaning',
  'Dashboard Polish',
  'Tyre Polish',
  'Glass Polish',
  'Air Freshener'
];

const FREQUENCY_TO_WASHES = {
  'daily': 30,
  '2-days-once': 15,
  '3-days-once': 10,
  'weekly-once': 4,
  'one-time': 1
};

const calculateAdjustedPrice = async (serviceDoc, userVehicle) => {
  const basePrice = serviceDoc?.price ?? 0;

  if (!userVehicle || !userVehicle.brand || !userVehicle.model) {
    return basePrice;
  }

  try {
    const brand = await Brand.findOne({ 
      name: userVehicle.brand,
      isActive: true 
    });

    if (!brand) {
      return basePrice;
    }

    const model = brand.models.find(m => 
      m.name?.toLowerCase() === String(userVehicle.model).toLowerCase() && m.isActive
    );

    if (Array.isArray(model.servicePricing) && serviceDoc?._id) {
      const entry = model.servicePricing.find((pricing) => {
        if (!pricing?.serviceId) return false;
        return pricing.serviceId.toString() === serviceDoc._id.toString();
      });
      if (entry && entry.finalPrice) {
        return entry.finalPrice;
      }
    }

    if (!model || !model.pricePercentage || model.pricePercentage === 0) {
      return basePrice;
    }

    const adjustedPrice = basePrice * (1 + (model.pricePercentage || 0) / 100);
    return Math.round(adjustedPrice);
  } catch (error) {
    console.error('Error calculating adjusted price:', error);
    return basePrice;
  }
};

const calculatePerWashMeta = (price = 0, frequency) => {
  const washes = FREQUENCY_TO_WASHES[frequency] || 1;
  const perWash = washes > 0 ? Number((price / washes).toFixed(2)) : Number(price || 0);
  return {
    washesPerCycle: washes,
    perWashPrice: perWash
  };
};

const mergeFeatures = (features = []) => {
  const sanitized = Array.isArray(features) ? features.filter(Boolean) : [];
  return Array.from(new Set([...DEFAULT_FEATURES, ...sanitized]));
};

const mapReviewPayload = (job) => ({
  id: job._id,
  rating: job.customerRating,
  feedback: job.customerFeedback,
  customerName: job.customerId?.name || 'Happy Customer',
  customerInitials: (job.customerId?.name || 'HC')
    .split(' ')
    .map((chunk) => chunk.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase(),
  serviceName: job.serviceId?.name,
  createdAt: job.updatedAt,
});

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getAllServices = async (req, res) => {
  try {
    const { category, isActive, vehicleType, userBrand, userModel } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (vehicleType) {
      const vtFilter = buildVehicleTypeFilter(vehicleType);
      if (vtFilter) {
        filter.vehicleType = vtFilter;
      }
    }

    const services = await Service.find(filter).sort({ createdAt: -1 });

    // Calculate adjusted prices if user vehicle info is provided
    let adjustedServices = services;
    if (userBrand && userModel) {
      const userVehicle = { brand: userBrand, model: userModel };
      
      adjustedServices = await Promise.all(
        services.map(async (service) => {
          const adjustedPrice = await calculateAdjustedPrice(service, userVehicle);
          return {
            ...service.toObject(),
            price: adjustedPrice
          };
        })
      );
    }

    res.status(200).json({
      status: 'success',
      results: adjustedServices.length,
      data: { services: adjustedServices }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching services'
    });
  }
};

// @desc    Get rich overview for service detail
// @route   GET /api/services/:id/overview
// @access  Public
exports.getServiceOverview = async (req, res) => {
  try {
    const { userBrand, userModel } = req.query;
    const service = await Service.findById(req.params.id).lean();

    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }

    // Calculate adjusted price if user vehicle info is provided
    let adjustedService = service;
    if (userBrand && userModel) {
      const userVehicle = { brand: userBrand, model: userModel };
      const adjustedPrice = await calculateAdjustedPrice(service, userVehicle);
      adjustedService = {
        ...service,
        price: adjustedPrice
      };
    }

    const featureList = mergeFeatures(service.features || []);
    const pricingMeta = calculatePerWashMeta(adjustedService.price, service.frequency);

    const galleryJobs = await Job.find({
      serviceId: service._id,
      afterPhotos: { $exists: true, $ne: [] }
    })
      .sort({ completedDate: -1, updatedAt: -1 })
      .limit(6)
      .select('afterPhotos')
      .lean();

    const galleryImages = [];
    galleryJobs.forEach((job) => {
      (job.afterPhotos || []).forEach((photo) => {
        if (galleryImages.length < 12) {
          galleryImages.push(photo);
        }
      });
    });

    const reviewDocs = await Job.find({
      serviceId: service._id,
      customerRating: { $ne: null },
      customerFeedback: { $nin: [null, ''] }
    })
      .populate('customerId', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const reviews = reviewDocs.map((doc) => mapReviewPayload(doc));
    const averageRating = reviews.length
      ? Number(
          (
            reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        )
      : null;

    res.status(200).json({
      status: 'success',
      data: {
        service: {
          ...adjustedService,
          features: featureList
        },
        pricing: pricingMeta,
        gallery: galleryImages,
        reviews: {
          averageRating,
          total: reviews.length,
          items: reviews
        }
      }
    });
  } catch (error) {
    console.error('Get service overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching service overview'
    });
  }
};

// @desc    Get recent public reviews across services
// @route   GET /api/services/public/reviews
// @access  Public
exports.getRecentReviews = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 20);

    const reviewDocs = await Job.find({
      customerRating: { $ne: null },
      customerFeedback: { $nin: [null, ''] }
    })
      .populate('customerId', 'name')
      .populate('serviceId', 'name')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    const reviews = reviewDocs.map((doc) => mapReviewPayload(doc));

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    console.error('Get recent reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching reviews'
    });
  }
};
// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = async (req, res) => {
  try {
    const { userBrand, userModel } = req.query;
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }

    // Calculate adjusted price if user vehicle info is provided
    let adjustedService = service.toObject();
    if (userBrand && userModel) {
      const userVehicle = { brand: userBrand, model: userModel };
      const adjustedPrice = await calculateAdjustedPrice(service, userVehicle);
      adjustedService.price = adjustedPrice;
    }
    
    res.status(200).json({
      status: 'success',
      data: { service: adjustedService }
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching service'
    });
  }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Admin
exports.createService = async (req, res) => {
  try {
    const allowedVehicleTypes = ['hatchback-sedan', 'suv-muv'];

    const serviceData = {
      ...req.body,
      vehicleType: allowedVehicleTypes.includes(req.body.vehicleType)
        ? req.body.vehicleType
        : 'hatchback-sedan',
      imageURL: req.file ? req.file.path : null
    };
    
    // Parse features if it's a string
    if (typeof serviceData.features === 'string') {
      serviceData.features = JSON.parse(serviceData.features);
    }
    
    const service = await Service.create(serviceData);
    
    res.status(201).json({
      status: 'success',
      message: 'Service created successfully',
      data: { service }
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error creating service'
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Admin
exports.updateService = async (req, res) => {
  try {
    const allowedVehicleTypes = ['hatchback-sedan', 'suv-muv'];
    const updateData = { ...req.body };

    if (updateData.vehicleType && !allowedVehicleTypes.includes(updateData.vehicleType)) {
      updateData.vehicleType = 'hatchback-sedan';
    }
    
    if (req.file) {
      updateData.imageURL = req.file.path;
    }
    
    // Parse features if it's a string
    if (typeof updateData.features === 'string') {
      updateData.features = JSON.parse(updateData.features);
    }
    
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Service updated successfully',
      data: { service }
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating service'
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Admin
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting service'
    });
  }
};
