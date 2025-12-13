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
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';

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

const ADD_ONS = [
  { id: 'microfiber', name: 'Micro Fiber Cloth', price: 100 },
  { id: 'engine', name: 'Engine Bay Cleaning', price: 100 },
  { id: 'alloy', name: 'Alloy Wheels Cleaning', price: 100 },
  { id: 'logo', name: 'Logo Cleaning', price: 100 }
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
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  const [serviceReviews, setServiceReviews] = useState([]);
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

  const toggleAddOn = (addOnId) => {
    setSelectedAddOns(prev => ({
      ...prev,
      [addOnId]: !prev[addOnId]
    }));
  };

  const totalAddOnPrice = useMemo(() => {
    return ADD_ONS.reduce((sum, addon) => {
      return selectedAddOns[addon.id] ? sum + addon.price : sum;
    }, 0);
  }, [selectedAddOns]);

  const totalPrice = useMemo(() => {
    const servicePrice = Number(resolvedService.price) || 0;
    return servicePrice + totalAddOnPrice;
  }, [totalAddOnPrice]);

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
            <View style={styles.addOnsContainer}>
              {ADD_ONS.map((addon) => (
                <TouchableOpacity
                  key={addon.id}
                  style={styles.addOnRow}
                  onPress={() => toggleAddOn(addon.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.addOnCheckbox, selectedAddOns[addon.id] && styles.addOnCheckboxSelected]}>
                    {selectedAddOns[addon.id] && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <View style={styles.addOnInfo}>
                    <Text style={styles.addOnName}>{addon.name}</Text>
                  </View>
                  <Text style={styles.addOnPrice}>{formatCurrency(addon.price)}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
            <View style={styles.heroOverlay}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="time-outline" size={14} color="#fff" />
                  <Text style={styles.heroBadgeText}>{service.duration || '--'} mins</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Ionicons name="repeat" size={14} color="#fff" />
                  <Text style={styles.heroBadgeText}>{formatFrequency(service.frequency)}</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>{service.name}</Text>
              <Text style={styles.heroSubtitle}>{service.description || 'Complete car care service'}</Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.planPriceCard}>
          <View style={styles.planPriceContent}>
            <Text style={styles.planPriceLabel}>PLAN PRICE</Text>
            <Text style={styles.planPriceAmount}>₹{resolvedService.price}</Text>
            <Text style={styles.planPriceBreakdown}>₹{Math.round(resolvedService.price / (FREQUENCY_TO_WASHES[resolvedService.frequency] || 1))} per wash · {FREQUENCY_TO_WASHES[resolvedService.frequency] || 1} washes / cycle</Text>
          </View>
          <TouchableOpacity 
            style={styles.planPriceChat}
            onPress={() => {}}
          >
            <Ionicons name="chatbubble" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.premiumLineSection}>
          <View style={styles.premiumLineIcon}>
            <Ionicons name="sparkles" size={20} color="#1453b4" />
          </View>
          <Text style={styles.premiumLine}>Professional car care service designed to keep your vehicle spotless and well-maintained</Text>
        </View>

        <View style={styles.keyInfoCardsSection}>
          <View style={styles.keyInfoCard}>
            <Ionicons name="calendar-outline" size={20} color="#1453b4" />
            <Text style={styles.keyInfoCardLabel}>Frequency</Text>
            <Text style={styles.keyInfoCardValue}>{formatFrequency(resolvedService.frequency)}</Text>
          </View>
          <View style={styles.keyInfoCard}>
            <Ionicons name="time-outline" size={20} color="#1453b4" />
            <Text style={styles.keyInfoCardLabel}>Duration</Text>
            <Text style={styles.keyInfoCardValue}>{resolvedService.duration || '--'} mins</Text>
          </View>
          <View style={styles.keyInfoCard}>
            <Ionicons name="albums-outline" size={20} color="#1453b4" />
            <Text style={styles.keyInfoCardLabel}>Category</Text>
            <Text style={styles.keyInfoCardValue}>{resolvedService.category || 'basic'}</Text>
          </View>
        </View>

        <View style={styles.contactSection}>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL(`tel:${SUPPORT_NUMBER}`)}
          >
            <Ionicons name="call" size={20} color="#1453b4" />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL(`https://wa.me/${SUPPORT_NUMBER.replace(/\D/g, '')}`)}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#1453b4" />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL(WEBSITE_URL)}
          >
            <Ionicons name="globe" size={20} color="#1453b4" />
            <Text style={styles.contactButtonText}>Website</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL(MAPS_URL)}
          >
            <Ionicons name="location" size={20} color="#1453b4" />
            <Text style={styles.contactButtonText}>Direction</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Share.share({
              message: `Check out ${service.name} on CarsTuneUp!`,
              url: WEBSITE_URL,
              title: service.name
            })}
          >
            <Ionicons name="share-social" size={20} color="#1453b4" />
            <Text style={styles.contactButtonText}>Share</Text>
          </TouchableOpacity>
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
        {Object.keys(selectedAddOns).length > 0 && (
          <View style={styles.totalAmountSection}>
            <Text style={styles.totalAmountLabel}>Service + Add-ons</Text>
            <Text style={styles.totalAmountValue}>
              {formatCurrency(
                resolvedService.price + 
                Object.keys(selectedAddOns).reduce((sum, addonId) => {
                  const addon = ADD_ONS.find(a => a.id === addonId);
                  return sum + (addon?.price || 0);
                }, 0)
              )}
            </Text>
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
            onPress={() => {
              Alert.alert(
                'Add Add-ons',
                'Select add-ons to enhance your service',
                [
                  {
                    text: 'Cancel',
                    onPress: () => {},
                    style: 'cancel'
                  },
                  {
                    text: 'Browse Add-ons',
                    onPress: () => setShowAddOnsModal(true),
                    style: 'default'
                  }
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showAddOnsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddOnsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropSpacer}
            onPress={() => setShowAddOnsModal(false)}
            activeOpacity={1}
          />
          <View style={styles.addOnsModalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enhance Your Service</Text>
              <TouchableOpacity onPress={() => setShowAddOnsModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.addOnsModalContent}
              showsVerticalScrollIndicator={false}
            >
              {ADD_ONS.map((addon) => (
                <TouchableOpacity
                  key={addon.id}
                  style={[
                    styles.modalAddOnRow,
                    selectedAddOns[addon.id] && styles.modalAddOnRowSelected
                  ]}
                  onPress={() => toggleAddOn(addon.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.modalCheckbox,
                      selectedAddOns[addon.id] && styles.modalCheckboxSelected
                    ]}
                  >
                    {selectedAddOns[addon.id] && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <View style={styles.modalAddOnInfo}>
                    <Text style={styles.modalAddOnName}>{addon.name}</Text>
                  </View>
                  <Text style={styles.modalAddOnPrice}>{formatCurrency(addon.price)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyAddOnsButton}
                onPress={() => setShowAddOnsModal(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.applyAddOnsButtonText}>Apply Add-Ons</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  heroSubtitle: {
    marginTop: 6,
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
  },
  premiumLineSection: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  premiumLineIcon: {
    marginTop: 2,
  },
  premiumLine: {
    fontSize: 14,
    color: '#1453b4',
    lineHeight: 21,
    fontWeight: '600',
    flex: 1,
  },
  planPriceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planPriceContent: {
    flex: 1,
  },
  planPriceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  planPriceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1453b4',
    marginBottom: 8,
  },
  planPriceBreakdown: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  planPriceChat: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1453b4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  keyInfoCardsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    flexDirection: 'row',
    gap: 12,
  },
  keyInfoCard: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  keyInfoCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  keyInfoCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
    textAlign: 'center',
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
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contactButton: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    borderRadius: 0,
    padding: 20,
    marginBottom: 0,
    shadowColor: 'transparent',
    elevation: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  tabPill: {
    flex: 1,
    borderRadius: 0,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 0,
    borderColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  tabPillActive: {
    backgroundColor: 'transparent',
    borderBottomColor: '#1453b4',
  },
  tabPillText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
  tabPillTextActive: {
    color: '#1453b4',
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addOnCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addOnCheckboxSelected: {
    backgroundColor: '#1453b4',
    borderColor: '#1453b4',
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  addOnPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1453b4',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalAmountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  totalAmountLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalAmountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1453b4',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropSpacer: {
    flex: 1,
  },
  addOnsModalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 24,
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
    paddingHorizontal: 20,
    paddingTop: 16,
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
});
