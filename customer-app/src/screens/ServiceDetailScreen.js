import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
  Animated,
  Share,
  Linking,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { wp, hp, rfs, getStatusBarHeight, getBottomSpace, spacing } from '../utils/responsive';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&h=720&fit=crop&crop=center';

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

const WEBSITE_URL = 'https://www.carztuneup.com';
const SUPPORT_NUMBER = '+917337718170';
const MAPS_QUERY = 'CarsTuneUp Car Wash';
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;

const TAB_ITEMS = [
  { key: 'about', label: 'About', icon: 'information-circle' },
  { key: 'addons', label: 'Add-ons', icon: 'add-circle' },
  { key: 'reviews', label: 'Reviews', icon: 'star' }
];


const STATIC_REVIEWS = [
  {
    id: 'review1',
    customerName: 'Rajesh Kumar',
    customerInitials: 'RK',
    rating: 5,
    feedback: 'Very professional service, car looks brand new!',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'review2',
    customerName: 'Priya Singh',
    customerInitials: 'PS',
    rating: 5,
    feedback: 'Excellent attention to detail. Highly recommend!',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'review3',
    customerName: 'Amit Patel',
    customerInitials: 'AP',
    rating: 4,
    feedback: 'Great service, very punctual and thorough.',
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const WHATSAPP_NUMBER = SUPPORT_NUMBER.replace('+', '');

const INCLUDED_ITEMS = [
  {
    id: 'foam',
    title: 'Exterior Foam Wash',
    description: 'High-pressure foam wash for paint-safe cleaning.',
    image: require('../../assets/foam_wash.jpg')
  },
  {
    id: 'vacuum',
    title: 'Interior Vacuum',
    description: 'Seats, carpets, mats & boot area vacuumed and deodorised.',
    image: require('../../assets/interior_vaccum.jpg')
  },
  {
    id: 'dicky-vacuum',
    title: 'Dicky Vacuuming',
    description: 'Boot area cleaned thoroughly for zero dust build-up.',
    image: require('../../assets/dicky_vacuuming.jpg')
  },
  {
    id: 'tyre',
    title: 'Tyre & Glass Care',
    description: 'Tyre dressing plus streak-free glass polishing.',
    image: require('../../assets/tyre_polish.jpg')
  }
];

const EXCLUDED_ITEMS = [
  {
    id: 'denting',
    title: 'Denting / Painting',
    description: 'Body repairs, repainting or dent removal are separate services.',
    image: require('../../assets/Exterior_high_pressure_wash.jpg')
  },
  {
    id: 'engine',
    title: 'Engine Bay Detailing',
    description: 'High-pressure engine-bay cleaning handled in premium detail.',
    image: require('../../assets/MUV_SUV.jpg')
  },
  {
    id: 'interior-resto',
    title: 'Seat Restoration',
    description: 'Leather repair/restoration available as an add-on package.',
    image: require('../../assets/White-Car-HD-Cart.jpg')
  },
  {
    id: 'insurance',
    title: 'Insurance / Claims',
    description: 'Policy claims, insurance work & paperwork are excluded.',
    image: require('../../assets/car_insurance.jpg')
  }
];

const formatCurrency = (amount) => {
  const numeric = Number(amount || 0);
  const hasFraction = numeric % 1 !== 0;
  return `₹${numeric.toLocaleString('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatFrequency = (freq) => {
  const displayNames = {
    'daily': 'Daily',
    '2-days-once': 'Every 2 Days',
    '3-days-once': 'Every 3 Days',
    'weekly-once': 'Weekly',
    'one-time': 'One Time'
  };
  return displayNames[freq] || freq;
};

const resolveImageUrl = (url) => {
  if (url && url.startsWith('http')) {
    return url;
  }

  if (url) {
    const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${base}${normalizedPath}`;
  }

  return FALLBACK_IMAGE;
};

const getCardImageSource = (source) => {
  if (!source) {
    return { uri: FALLBACK_IMAGE };
  }
  return typeof source === 'number' ? source : { uri: source };
};

export default function ServiceDetailScreen({ route, navigation }) {
  const { service } = route.params;
  const { currentVehicle } = useApp();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('about');
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const [addons, setAddons] = useState([]);
  const [serviceReviews, setServiceReviews] = useState([]);
  const [addOnsModalVisible, setAddOnsModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tabContentAnim = useRef(new Animated.Value(1)).current;

  const heroImage = useMemo(() => resolveImageUrl(service.imageURL), [service.imageURL]);

  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      setOverviewError('');
      
      const params = {};
      
      // Add vehicle information for percentage-based pricing
      if (currentVehicle && currentVehicle.brand && currentVehicle.model) {
        params.userBrand = currentVehicle.brand;
        params.userModel = currentVehicle.model;
      }
      
      const response = await api.get(`/services/${service._id}/overview`, { params });
      setOverviewData(response.data?.data || null);
      
      // Fetch addons from database
      try {
        const addonsResponse = await api.get('/addons');
        if (addonsResponse.data.status === 'success') {
          setAddons(addonsResponse.data.data.addons || []);
        }
      } catch (addonError) {
        console.error('Error fetching addons:', addonError);
        setAddons([]);
      }
      
      // Fetch service reviews from feedback/top endpoint (same as Home page)
      try {
        const reviewsResponse = await api.get('/feedback/top');
        if (reviewsResponse.data.status === 'success') {
          setServiceReviews(reviewsResponse.data.data.feedback || []);
        }
      } catch (reviewError) {
        console.error('Error fetching reviews:', reviewError);
        setServiceReviews([]);
      }
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Service overview error:', error);
      setOverviewError('Unable to load service overview. Pull to refresh.');
    } finally {
      setOverviewLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [service._id, currentVehicle]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOverview();
  };

  const handleAddToCart = () => {
    addToCart(service, selectedAddOns);
    navigation.navigate('Cart');
  };

  const toggleAddOn = (addonId, addon) => {
    setSelectedAddOns(prev => {
      const updated = { ...prev };
      if (updated[addonId]) {
        delete updated[addonId];
      } else {
        updated[addonId] = addon;
      }
      return updated;
    });
  };

  const openAddOnsModal = () => {
    setAddOnsModalVisible(true);
  };

  const closeAddOnsModal = () => {
    setAddOnsModalVisible(false);
  };

  const resolvedService = useMemo(() => {
    if (overviewData?.service) {
      return { ...service, ...overviewData.service };
    }
    return service;
  }, [overviewData, service]);

  const featuresList = useMemo(() => {
    if (overviewData?.service?.features?.length) {
      return overviewData.service.features;
    }
    if (Array.isArray(service.features) && service.features.length) {
      return service.features;
    }
    return DEFAULT_FEATURES;
  }, [overviewData, service.features]);

  const pricingMeta = useMemo(() => {
    if (overviewData?.pricing) {
      return overviewData.pricing;
    }
    const washes = FREQUENCY_TO_WASHES[service.frequency] || 1;
    const basePrice = Number(service.price) || 0;
    const perWash = washes ? Number((basePrice / washes).toFixed(2)) : basePrice;
    return {
      washesPerCycle: washes,
      perWashPrice: perWash
    };
  }, [overviewData, service.frequency, service.price]);

  const galleryImages = overviewData?.gallery || [];
  const reviews = overviewData?.reviews?.items || [];
  const averageRating = overviewData?.reviews?.averageRating || null;
  const totalReviews = overviewData?.reviews?.total || reviews.length || 0;

  const handleOpenLink = async (url, fallbackMessage = 'Please try again later.') => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error('Unsupported URL');
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error('Open link error:', error);
      Alert.alert('Unable to open link', fallbackMessage);
    }
  };

  const handleWebsite = () => handleOpenLink(WEBSITE_URL);
  const handleCall = () => handleOpenLink(`tel:${SUPPORT_NUMBER}`, `Call us at ${SUPPORT_NUMBER}`);
  const handleWhatsApp = () => handleOpenLink(`https://wa.me/${WHATSAPP_NUMBER}`, 'Unable to open WhatsApp');
  const handleDirections = () => handleOpenLink(MAPS_URL);
  const handleShareService = async () => {
    try {
      const message = `Check out the ${service.name} plan from CarsTuneUp. ${WEBSITE_URL}`;
      await Share.share({ message, url: WEBSITE_URL });
    } catch (shareError) {
      console.error('Share service error:', shareError);
    }
  };

  const handleFeedbackPress = () => {
    navigation.navigate('MainTabs', { screen: 'Home', params: { highlightFeedback: true } });
  };

  const quickActions = [
    { key: 'website', label: 'Website', icon: 'globe-outline', onPress: handleWebsite },
    { key: 'call', label: 'Call', icon: 'call', onPress: handleCall },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', onPress: handleWhatsApp },
    { key: 'map', label: 'Directions', icon: 'navigate', onPress: handleDirections },
    { key: 'share', label: 'Share', icon: 'share-social', onPress: handleShareService }
  ];

  const animateTabSwap = (tabKey) => {
    setActiveTab(tabKey);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tabContentAnim, {
        toValue: 0.95,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(tabContentAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const totalAddOnPrice = useMemo(() => {
    return Object.values(selectedAddOns).reduce((sum, addon) => {
      return sum + (Number(addon.price) || 0);
    }, 0);
  }, [selectedAddOns]);

  const totalPrice = useMemo(() => {
    const servicePrice = Number(resolvedService.price) || 0;
    return servicePrice + totalAddOnPrice;
  }, [resolvedService.price, totalAddOnPrice]);

  const renderStars = (rating = 0) => {
    const items = [];
    for (let i = 1; i <= 5; i += 1) {
      const diff = rating - i;
      let icon = 'star-outline';
      if (diff >= 0) {
        icon = 'star';
      } else if (diff > -1) {
        icon = 'star-half';
      }
      items.push(
        <Ionicons
          key={`star-${i}`}
          name={icon}
          size={14}
          color="#1453b4"
        />
      );
    }
    return <View style={styles.starsRow}>{items}</View>;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'addons':
        return (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>Add-On Services</Text>
            {addons.length > 0 ? (
              <View style={styles.addOnsContainer}>
                {addons.map((addon) => {
                  const isSelected = !!selectedAddOns[addon._id];
                  return (
                    <TouchableOpacity
                      key={addon._id}
                      style={[
                        styles.addOnRow,
                        isSelected && styles.addOnRowSelected
                      ]}
                      onPress={() => toggleAddOn(addon._id, addon)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addOnImageContainer}>
                        {addon.imageURL ? (
                          <Image
                            source={{ uri: addon.imageURL }}
                            style={styles.addOnImage}
                          />
                        ) : (
                          <View style={styles.addOnImagePlaceholder}>
                            <Ionicons name="cube-outline" size={28} color="#D1D5DB" />
                          </View>
                        )}
                      </View>
                      <View style={styles.addOnTextContainer}>
                        <Text style={styles.addOnName}>{addon.name}</Text>
                        {addon.description && (
                          <Text style={styles.addOnDescription} numberOfLines={2}>
                            {addon.description}
                          </Text>
                        )}
                        <Text style={styles.addOnPrice}>{formatCurrency(addon.price || 0)}</Text>
                      </View>
                      <View style={[styles.addOnCheckboxRight, isSelected && styles.addOnCheckboxRightSelected]}>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noAddonsText}>No add-ons available at the moment.</Text>
            )}
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>What Our Customers Say</Text>
            {serviceReviews.length > 0 ? (
              <View style={styles.reviewsCarouselContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.reviewsCarousel}
                  contentContainerStyle={styles.reviewsCarouselContent}
                  snapToInterval={300}
                  snapToAlignment="center"
                  decelerationRate="fast"
                >
                  {serviceReviews.slice(0, 10).map((review, index) => (
                    <Animated.View
                      key={review._id || index}
                      style={[
                        styles.reviewCardAnimated,
                        {
                          opacity: fadeAnim,
                        }
                      ]}
                    >
                      <View style={styles.reviewCardContent}>
                        <View style={styles.reviewHeader}>
                          <View style={styles.reviewStarsContainer}>
                            {renderStars(review.rating || 5)}
                          </View>
                          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                        </View>
                        <Text style={styles.reviewCustomerName}>{review.customerName || review.userName || 'Anonymous'}</Text>
                        <Text style={styles.reviewFeedbackText} numberOfLines={4}>{review.feedback || review.comment || review.text}</Text>
                        <View style={styles.reviewFooter}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text style={styles.verifiedText}>Verified Customer</Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </ScrollView>
                {serviceReviews.length > 1 && (
                  <View style={styles.reviewPaginationDots}>
                    {serviceReviews.slice(0, 5).map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.reviewDot,
                          index === 0 && styles.reviewDotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noReviewsContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
                <Text style={styles.noReviewsText}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtext}>Be the first to share your experience!</Text>
              </View>
            )}
          </View>
        );
      case 'about':
      default:
        return (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>About this service</Text>
            <View style={styles.featureList}>
              {featuresList.map((feature, index) => (
                <View key={`${feature}-${index}`} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#1453b4" />
                  <Text style={styles.featureRowText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: heroImage }}
            style={styles.heroImage}
            imageStyle={styles.heroImageRadius}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.85)']}
              style={styles.heroGradientOverlay}
            >
              <View style={styles.heroBottomContent}>
                <Text style={styles.heroServiceName}>{service.name}</Text>
                <View style={styles.heroInfoBadges}>
                  <View style={styles.heroBadgeItem}>
                    <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.heroBadgeText}>{service.duration || '--'} mins</Text>
                  </View>
                  <View style={styles.heroBadgeDivider} />
                  <View style={styles.heroBadgeItem}>
                    <Ionicons name="repeat-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.heroBadgeText}>{formatFrequency(service.frequency)}</Text>
                  </View>
                  <View style={styles.heroBadgeDivider} />
                  <View style={styles.heroBadgeItem}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.heroBadgeText}>4.8</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
            <TouchableOpacity 
              style={styles.shareIconOverlay}
              onPress={handleShareService}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </ImageBackground>
        </View>

        {/* Clean Professional Pricing - No Cards */}
        <View style={styles.themePricingSection}>
          <View style={styles.priceMainRow}>
            <View style={styles.priceLeftContent}>
              <Text style={styles.themePriceAmount}>₹{resolvedService.price}</Text>
              {resolvedService.frequency !== 'one-time' && (
                <Text style={styles.themePerMonthText}>per month</Text>
              )}
            </View>
            <View style={styles.priceRightBadge}>
              <Ionicons name="pricetag-outline" size={20} color="#1453b4" />
            </View>
          </View>
          <View style={styles.priceDetailsRow}>
            <View style={styles.priceDetailBox}>
              <Ionicons name="water-outline" size={16} color="#1453b4" />
              <Text style={styles.priceDetailText}>₹{Math.round(resolvedService.price / (FREQUENCY_TO_WASHES[resolvedService.frequency] || 1))} per wash</Text>
            </View>
            {resolvedService.frequency !== 'one-time' && (
              <View style={styles.priceDetailBox}>
                <Ionicons name="calendar-outline" size={16} color="#10B981" />
                <Text style={styles.priceDetailText}>{FREQUENCY_TO_WASHES[resolvedService.frequency] || 1} washes</Text>
              </View>
            )}
          </View>
        </View>

        {/* Attractive Info Cards */}
        <View style={styles.attractiveInfoSection}>
          <View style={styles.attractiveInfoCard}>
            <View style={styles.infoCardIconCircle}>
              <Ionicons name="calendar" size={24} color="#1453b4" />
            </View>
            <Text style={styles.infoCardLabel}>Frequency</Text>
            <Text style={styles.infoCardValue}>{formatFrequency(resolvedService.frequency)}</Text>
          </View>
          <View style={styles.attractiveInfoCard}>
            <View style={styles.infoCardIconCircle}>
              <Ionicons name="time" size={24} color="#10B981" />
            </View>
            <Text style={styles.infoCardLabel}>Duration</Text>
            <Text style={styles.infoCardValue}>{resolvedService.duration || '--'} mins</Text>
          </View>
          <View style={styles.attractiveInfoCard}>
            <View style={styles.infoCardIconCircle}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <Text style={styles.infoCardLabel}>Rating</Text>
            <Text style={styles.infoCardValue}>4.8</Text>
          </View>
        </View>

        {/* Professional Description Box */}
        <View style={styles.attractiveDescriptionBox}>
          <View style={styles.descriptionHeader}>
            <Ionicons name="information-circle" size={22} color="#1453b4" />
            <Text style={styles.descriptionTitle}>About This Service</Text>
          </View>
          <Text style={styles.descriptionText}>Professional car care service designed to keep your vehicle spotless and well-maintained with expert attention to detail</Text>
        </View>

        <View style={styles.tabsContainer}>
          <View style={styles.tabsRow}>
            {TAB_ITEMS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
                onPress={() => animateTabSwap(tab.key)}
              >
                <Text
                  style={[styles.tabPillText, activeTab === tab.key && styles.tabPillTextActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Animated.View
            style={[
              styles.tabContentWrapper,
              { opacity: fadeAnim },
              { transform: [{ scale: tabContentAnim }] }
            ]}
          >
            {overviewLoading ? (
              <ActivityIndicator color="#1453b4" />
            ) : (
              renderTabContent()
            )}
          </Animated.View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        {totalAddOnPrice > 0 && (
          <View style={styles.selectedAddOnsSection}>
            <View style={styles.totalAmountSection}>
              <Text style={styles.totalAmountLabel}>Service + Add-ons</Text>
              <Text style={styles.totalAmountValue}>
                {formatCurrency(totalPrice)}
              </Text>
            </View>
            {/* Selected Add-ons List */}
            <View style={styles.selectedAddOnsList}>
              {Object.values(selectedAddOns).filter(addon => addon && addon._id).map((addon) => (
                <View key={addon._id} style={styles.selectedAddOnItem}>
                  <View style={styles.selectedAddOnInfo}>
                    <Text style={styles.selectedAddOnName}>{addon.name || 'Add-on'}</Text>
                    <Text style={styles.selectedAddOnPrice}>{formatCurrency(addon.price || 0)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeAddOnButton}
                    onPress={() => toggleAddOn(addon._id, addon)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.addToCartButtonContainer}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            activeOpacity={0.9}
          >
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addOnsIconButton}
            onPress={openAddOnsModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Add-ons Modal - Half Page Bottom Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addOnsModalVisible}
        onRequestClose={closeAddOnsModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1} 
          onPress={closeAddOnsModal}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.addOnsModalContainer}
          >
            {/* Modal Header */}
            <View style={styles.addOnsModalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.addOnsHeaderContent}>
                <Text style={styles.addOnsModalTitle}>Add Extra Services</Text>
                <TouchableOpacity onPress={closeAddOnsModal} style={styles.closeModalButton}>
                  <Ionicons name="close" size={24} color="#1453b4" />
                </TouchableOpacity>
              </View>
              <Text style={styles.addOnsModalSubtitle}>Enhance your car care experience</Text>
            </View>

            {/* Add-ons List */}
            <ScrollView 
              style={styles.addOnsModalBody}
              showsVerticalScrollIndicator={false}
            >
              {addons.length === 0 ? (
                <View style={styles.noAddOnsContainer}>
                  <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.noAddOnsText}>No add-ons available</Text>
                </View>
              ) : (
                addons.map((addon) => {
                  const isSelected = !!selectedAddOns[addon._id];
                  return (
                    <TouchableOpacity
                      key={addon._id}
                      style={[
                        styles.addOnModalCard,
                        isSelected && styles.addOnModalCardSelected
                      ]}
                      onPress={() => toggleAddOn(addon._id, addon)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addOnModalImageContainer}>
                        {addon.imageURL ? (
                          <Image
                            source={{ uri: addon.imageURL }}
                            style={styles.addOnModalImage}
                          />
                        ) : (
                          <View style={styles.addOnModalImagePlaceholder}>
                            <Ionicons name="cube-outline" size={32} color="#D1D5DB" />
                          </View>
                        )}
                      </View>
                      <View style={styles.addOnModalTextContainer}>
                        <Text style={styles.addOnModalTitle}>{addon.name}</Text>
                        {addon.description && (
                          <Text style={styles.addOnModalDescription} numberOfLines={2}>
                            {addon.description}
                          </Text>
                        )}
                        <Text style={styles.addOnModalPrice}>{formatCurrency(addon.price)}</Text>
                      </View>
                      <View style={[styles.addOnModalCheckboxRight, isSelected && styles.addOnModalCheckboxRightSelected]}>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.addOnsModalFooter}>
              <View style={styles.addOnsFooterInfo}>
                <Text style={styles.addOnsCountText}>
                  {Object.keys(selectedAddOns).length} add-on{Object.keys(selectedAddOns).length !== 1 ? 's' : ''} selected
                </Text>
                <Text style={styles.addOnsTotalText}>
                  {formatCurrency(totalAddOnPrice)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addOnsConfirmButton}
                onPress={closeAddOnsModal}
              >
                <Text style={styles.addOnsConfirmButtonText}>Done</Text>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    backgroundColor: '#fff',
    marginBottom: 0,
  },
  heroImage: {
    height: 240,
    width: '100%',
  },
  heroImageRadius: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  ratingText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  premiumLineSection: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumLineIcon: {
    marginTop: 2,
  },
  premiumLine: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    fontWeight: '700',
    flex: 1,
  },
  planPriceCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  planPriceContent: {
    flex: 1,
  },
  planPriceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  planPriceAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceBreakdownDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  planPriceBreakdown: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  planPriceChat: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  keyInfoCardsSection: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  keyInfoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0EAFF',
    minHeight: 140,
  },
  iconCircleLight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  keyInfoCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  keyInfoCardValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1453b4',
    textAlign: 'center',
    lineHeight: 16,
  },
  keyInfoSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    gap: 16,
  },
  keyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  keyInfoContent: {
    flex: 1,
  },
  keyInfoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  keyInfoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  vehicleAndInfoSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  vehiclePillSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  vehiclePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1453b4',
  },
  infoCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
    textAlign: 'center',
  },
  washesSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    borderLeftWidth: 3,
    borderLeftColor: '#1453b4',
  },
  washesContent: {
    paddingVertical: 8,
  },
  washesCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  washesSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  contactSection: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  contactButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  contactButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsContainer: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  tabPill: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#1453b4',
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  tabPillText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 13,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabContentWrapper: {
    minHeight: 200,
  },
  tabSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: -4,
  },
  sectionBody: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  metaList: {
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  featureList: {
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1453b4',
  },
  featureRowText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
    lineHeight: 22,
    fontWeight: '500',
  },
  addOnsContainer: {
    gap: 12,
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1453b4',
  },
  addOnRowSelected: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#10B981',
  },
  addOnImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  addOnImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addOnImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  addOnCheckboxRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOnCheckboxRightSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  addOnTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 4,
  },
  addOnName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  addOnDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  addOnPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1453b4',
  },
  noAddonsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewsList: {
    gap: 16,
  },
  reviewCardNew: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reviewStars: {
    marginBottom: 8,
  },
  reviewNameNew: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  reviewFeedback: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDateNew: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  seeAllReviewsButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  seeAllReviewsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1453b4',
  },
  reviewsCarouselContainer: {
    marginTop: 16,
  },
  reviewsCarousel: {
    flexGrow: 0,
  },
  reviewsCarouselContent: {
    paddingHorizontal: 0,
    gap: 12,
  },
  reviewCardAnimated: {
    width: 300,
    marginHorizontal: 6,
  },
  reviewCardContent: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1453b4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewStarsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewCustomerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  reviewFeedbackText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  reviewPaginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  reviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  reviewDotActive: {
    backgroundColor: '#1453b4',
    width: 24,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  noReviewsSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  gallerySquare: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 10,
  },
  emptyStateCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    gap: 6,
  },
  emptyStateText: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef9c3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontWeight: '700',
    color: '#92400e',
  },
  reviewCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    fontWeight: '600',
    color: '#0f172a',
  },
  reviewDate: {
    color: '#94a3b8',
    fontSize: 12,
  },
  reviewText: {
    marginTop: 6,
    color: '#1f2937',
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  feedbackButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1453b4',
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  feedbackButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  feedbackHelperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  inclusionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  inclusionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAllLink: {
    color: '#1453b4',
    fontWeight: '600',
  },
  inclusionToggleRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inclusionToggleBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    alignItems: 'center',
  },
  inclusionToggleActive: {
    backgroundColor: '#1453b4',
  },
  inclusionToggleText: {
    color: '#475569',
    fontWeight: '600',
  },
  inclusionToggleTextActive: {
    color: '#fff',
  },
  inclusionScroll: {
    paddingHorizontal: 20,
  },
  inclusionCardItem: {
    width: 220,
    height: 150,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 16,
  },
  inclusionImage: {
    width: '100%',
    height: '100%',
  },
  inclusionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  inclusionTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  inclusionDesc: {
    color: '#e2e8f0',
    fontSize: 12,
    marginTop: 4,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E7F3FF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 90,
  },
  noteTitle: {
    fontWeight: '600',
    color: '#1F2933',
    marginBottom: 4,
  },
  noteText: {
    color: '#4B5563',
    fontSize: 13,
  },
  priceSummaryCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1453b4',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + getBottomSpace(),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedAddOnsSection: {
    marginBottom: 12,
  },
  totalAmountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  totalAmountLabel: {
    fontSize: 14,
    color: '#1453b4',
    fontWeight: '600',
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1453b4',
  },
  selectedAddOnsList: {
    gap: 8,
  },
  selectedAddOnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedAddOnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    marginRight: 8,
  },
  selectedAddOnName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  selectedAddOnPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1453b4',
    marginLeft: 8,
  },
  removeAddOnButton: {
    padding: 4,
  },
  addToCartButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    height: 56,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#1453b4',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addOnsIconButton: {
    backgroundColor: '#1453b4',
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addOnsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  addOnsModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addOnsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  addOnsModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1453b4',
  },
  addOnsModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  closeModalButton: {
    padding: 4,
  },
  addOnsModalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '100%',
  },
  noAddOnsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noAddOnsText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
    fontWeight: '500',
  },
  addOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addOnCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1453b4',
  },
  addOnCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  addOnCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  addOnCheckboxSelected: {
    backgroundColor: '#1453b4',
    borderColor: '#1453b4',
  },
  addOnInfo: {
    flex: 1,
  },
  addOnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  addOnDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  addOnPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1453b4',
    marginLeft: 12,
  },
  addOnsModalFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + getBottomSpace(),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  addOnsFooterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addOnsCountText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  addOnsTotalText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1453b4',
  },
  addOnsConfirmButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addOnsConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  addOnsModalContent: {
    paddingHorizontal: 20,
    maxHeight: 300,
  },
  addOnModalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1453b4',
  },
  addOnModalCardSelected: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#10B981',
  },
  addOnModalImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  addOnModalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addOnModalImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  addOnModalCheckboxRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOnModalCheckboxRightSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  addOnModalTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  addOnModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  addOnModalDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  addOnModalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1453b4',
  },
  modalAddOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  modalAddOnRowSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#1453b4',
  },
  modalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCheckboxSelected: {
    backgroundColor: '#1453b4',
    borderColor: '#1453b4',
  },
  modalAddOnInfo: {
    flex: 1,
  },
  modalAddOnName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalAddOnPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1453b4',
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: getBottomSpace(),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyAddOnsButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyAddOnsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Date Picker Styles
  datePickerSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1453b4',
    marginLeft: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dateTimePicker: {
    marginHorizontal: 20,
  },
  // Attractive Professional Redesign Styles
  shareIconOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroGradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroBottomContent: {
    gap: 12,
  },
  heroServiceName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 0.5,
  },
  heroInfoBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 12,
  },
  heroBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroBadgeDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  themePricingSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  priceMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLeftContent: {
    flex: 1,
  },
  themePriceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1453b4',
    marginBottom: 4,
  },
  themePerMonthText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceRightBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceDetailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceDetailBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#1453b4',
  },
  priceDetailText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  attractiveInfoSection: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  attractiveInfoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F4F8',
  },
  infoCardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  attractiveDescriptionBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#1453b4',
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontWeight: '500',
  },
});
