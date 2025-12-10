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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../config/api';
import { useApp } from '../context/AppContext';

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
  { key: 'services', label: 'Services', icon: 'checkmark-done' },
  { key: 'gallery', label: 'Gallery', icon: 'images' },
  { key: 'reviews', label: 'Reviews', icon: 'chatbubbles' }
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [inclusionFilter, setInclusionFilter] = useState('included');
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tabContentAnim = useRef(new Animated.Value(1)).current;
  const inclusionAnim = useRef(new Animated.Value(1)).current;

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

  // Date picker functions
  const showDatePickerModal = () => {
    console.log('🗓️ Opening date picker, current date:', selectedStartDate);
    setShowDatePicker(true);
  };

  const hideDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleDateChange = (event, selectedDate) => {
    console.log('🗓️ Date picker event:', event.type, 'selectedDate:', selectedDate);
    
    if (event.type === 'set' && selectedDate) {
      console.log('🗓️ Date set to:', selectedDate);
      setSelectedStartDate(selectedDate);
    }
    
    // Hide picker after selection or cancellation
    if (event.type === 'set' || event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubscribe = async () => {
    console.log('🗓️ Subscribing with start date:', selectedStartDate);
    setLoading(true);
    try {
      const response = await api.post('/subscriptions', {
        serviceId: service._id,
        startDate: selectedStartDate, // Send user-selected date
      });

      const subscription = response.data.data.subscription;
      const startDate = new Date(subscription.startDate);
      const formattedDate = formatDate(startDate);

      Alert.alert(
        'Success',
        `Subscription created successfully!\n\nStart Date: ${formattedDate}\n\nYour first wash will be scheduled for ${formatDate(startDate)}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Subscriptions'),
          },
        ]
      );
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Unable to create subscription'
      );
    } finally {
      setLoading(false);
    }
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

  const animateTabSwap = (nextTab) => {
    if (nextTab === activeTab) return;
    Animated.sequence([
      Animated.timing(tabContentAnim, {
        toValue: 0.9,
        duration: 120,
        useNativeDriver: true
      }),
      Animated.timing(tabContentAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true
      })
    ]).start();
    setActiveTab(nextTab);
  };

  const animateInclusionSwap = (nextFilter) => {
    if (nextFilter === inclusionFilter) return;
    Animated.sequence([
      Animated.timing(inclusionAnim, {
        toValue: 0.92,
        duration: 120,
        useNativeDriver: true
      }),
      Animated.timing(inclusionAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true
      })
    ]).start();
    setInclusionFilter(nextFilter);
  };

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
          color="#facc15"
        />
      );
    }
    return <View style={styles.starsRow}>{items}</View>;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'services':
        return (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>Included services</Text>
            <View style={styles.featureList}>
              {featuresList.map((feature, index) => (
                <View key={`${feature}-${index}`} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#1d9bf0" />
                  <Text style={styles.featureRowText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      case 'gallery':
        return (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            {galleryImages.length ? (
              <View style={styles.galleryGrid}>
                {galleryImages.map((image, index) => (
                  <Image
                    key={`${image}-${index}`}
                    source={{ uri: resolveImageUrl(image) }}
                    style={styles.gallerySquare}
                    resizeMode="cover"
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <Ionicons name="images" size={22} color="#94a3b8" />
                <Text style={styles.emptyStateText}>Our detailing shots will appear here after your first service.</Text>
              </View>
            )}
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.tabSection}>
            <View style={styles.reviewsHeader}>
              <View>
                <Text style={styles.sectionTitle}>Customer reviews</Text>
                <Text style={styles.sectionSubtitle}>
                  {totalReviews ? `${totalReviews} review${totalReviews > 1 ? 's' : ''}` : 'No reviews yet'}
                </Text>
              </View>
              {averageRating && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={16} color="#facc15" />
                  <Text style={styles.ratingBadgeText}>{averageRating}</Text>
                </View>
              )}
            </View>
            {reviews.length ? (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{review.customerInitials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewName}>{review.customerName}</Text>
                      <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                    </View>
                    {renderStars(review.rating)}
                    <Text style={styles.reviewText}>{review.feedback}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateCard}>
                <Ionicons name="chatbubbles-outline" size={22} color="#94a3b8" />
                <Text style={styles.emptyStateText}>Reviews will appear here once customers submit feedback.</Text>
              </View>
            )}
            <TouchableOpacity style={styles.feedbackButton} onPress={handleFeedbackPress}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
              <Text style={styles.feedbackButtonText}>Share your feedback</Text>
            </TouchableOpacity>
            <Text style={styles.feedbackHelperText}>Feedback opens on the Home screen once a job is completed.</Text>
          </View>
        );
      case 'about':
      default:
        return (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>About the service</Text>
            <Text style={styles.sectionBody}>
              {resolvedService.description || 'Premium detailing for a spotless car inside and out.'}
            </Text>
            <View style={styles.metaList}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color="#1453b4" />
                <View>
                  <Text style={styles.metaLabel}>Duration</Text>
                  <Text style={styles.metaValue}>{resolvedService.duration || '--'} mins</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={18} color="#1453b4" />
                <View>
                  <Text style={styles.metaLabel}>Frequency</Text>
                  <Text style={styles.metaValue}>{formatFrequency(resolvedService.frequency)}</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="albums-outline" size={18} color="#1453b4" />
                <View>
                  <Text style={styles.metaLabel}>Category</Text>
                  <Text style={styles.metaValue}>{resolvedService.category || 'Premium'}</Text>
                </View>
              </View>
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
      >
        <View style={styles.mediaCard}>
          <ImageBackground
            source={{ uri: heroImage }}
            style={styles.heroImage}
            imageStyle={styles.heroImageRadius}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text style={styles.heroBadgeText}>{formatFrequency(service.frequency)}</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Ionicons name="time-outline" size={16} color="#fff" />
                  <Text style={styles.heroBadgeText}>{service.duration || '--'} mins</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>{service.name}</Text>
              <Text style={styles.heroSubtitle} numberOfLines={2}>{service.description || 'Complete care for your car inside and out.'}</Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.priceCopy}>
              <Text style={styles.sectionLabel}>Plan price</Text>
              <Text style={styles.priceText}>{formatCurrency(resolvedService.price)}</Text>
              {pricingMeta?.perWashPrice ? (
                <Text style={styles.priceSubText}>
                  {`${formatCurrency(pricingMeta.perWashPrice)} per wash · ${pricingMeta.washesPerCycle || 1} washes / cycle`}
                </Text>
              ) : null}
            </View>
            <View style={styles.vehicleWrapper}>
              <View style={styles.vehiclePill}>
                <Ionicons name="car-sport" size={16} color="#1d4ed8" />
                <Text style={styles.vehiclePillText} numberOfLines={1}>
                  {(resolvedService.vehicleType || 'hatchback-sedan').replace('-', ' / ')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Ionicons name="calendar-outline" size={18} color="#1453b4" />
              <Text style={styles.overviewLabel}>Frequency</Text>
              <Text style={styles.overviewValue}>{formatFrequency(resolvedService.frequency)}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Ionicons name="time-outline" size={18} color="#1453b4" />
              <Text style={styles.overviewLabel}>Duration</Text>
              <Text style={styles.overviewValue}>{resolvedService.duration || '--'} mins</Text>
            </View>
            <View style={styles.overviewItem}>
              <Ionicons name="albums-outline" size={18} color="#1453b4" />
              <Text style={styles.overviewLabel}>Category</Text>
              <Text style={styles.overviewValue}>{resolvedService.category || 'Premium'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsCard}>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.key} style={styles.quickAction} onPress={action.onPress}>
                <View style={styles.quickIconWrapper}>
                  <Ionicons name={action.icon} size={18} color="#1d4ed8" />
                </View>
                <Text style={styles.quickLabel} numberOfLines={1}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {overviewError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color="#b45309" />
            <Text style={styles.errorText}>{overviewError}</Text>
          </View>
        ) : null}

        <View style={styles.tabsContainer}>
          <View style={styles.tabsRow}>
            {TAB_ITEMS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
                onPress={() => animateTabSwap(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={activeTab === tab.key ? '#fff' : '#475569'}
                />
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

        <View style={styles.inclusionCard}>
          <View style={styles.inclusionHeader}>
            <Text style={styles.sectionTitle}>Included vs Excluded</Text>
            <TouchableOpacity onPress={() => setShowAllModal(true)}>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inclusionToggleRow}>
            {['included', 'excluded'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.inclusionToggleBtn, inclusionFilter === type && styles.inclusionToggleActive]}
                onPress={() => animateInclusionSwap(type)}
              >
                <Text style={[styles.inclusionToggleText, inclusionFilter === type && styles.inclusionToggleTextActive]}>
                  {type === 'included' ? 'Included items' : 'Excluded items'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Animated.View style={{ transform: [{ scale: inclusionAnim }] }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inclusionScroll}
            >
              {(inclusionFilter === 'included' ? INCLUDED_ITEMS : EXCLUDED_ITEMS).map((item) => (
                <View key={item.id} style={styles.inclusionCardItem}>
                  <Image source={getCardImageSource(item.image)} style={styles.inclusionImage} />
                  <View style={styles.inclusionOverlay}>
                    <Text style={styles.inclusionTitle}>{item.title}</Text>
                    <Text style={styles.inclusionDesc} numberOfLines={2}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={24} color="#1453b4" />
          <View style={{ flex: 1 }}>
            <Text style={styles.noteTitle}>Need a specific schedule?</Text>
            <Text style={styles.noteText}>Our team will confirm your preferred day & time after you subscribe.</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        {/* Date Picker Section */}
        <View style={styles.datePickerSection}>
          <View style={styles.datePickerHeader}>
            <Ionicons name="calendar-outline" size={20} color="#1453b4" />
            <Text style={styles.datePickerLabel}>Start Date</Text>
          </View>
          <TouchableOpacity 
            style={styles.datePickerButton} 
            onPress={showDatePickerModal}
          >
            <Text style={styles.datePickerText}>{formatDate(selectedStartDate)}</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedStartDate}
          mode={datePickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
          style={styles.dateTimePicker}
        />
      )}

      <Modal
        visible={showAllModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalBackdropSpacer} onPress={() => setShowAllModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Full breakdown</Text>
              <TouchableOpacity onPress={() => setShowAllModal(false)}>
                <Ionicons name="close" size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalList}>
              <Text style={styles.modalSectionHeading}>Included</Text>
              {INCLUDED_ITEMS.map((item) => (
                <View key={`modal-${item.id}`} style={styles.modalRow}>
                  <Image source={getCardImageSource(item.image)} style={styles.modalRowImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalRowTitle}>{item.title}</Text>
                    <Text style={styles.modalRowDesc}>{item.description}</Text>
                  </View>
                </View>
              ))}
              <Text style={[styles.modalSectionHeading, { marginTop: 12 }]}>Excluded</Text>
              {EXCLUDED_ITEMS.map((item) => (
                <View key={`modal-ex-${item.id}`} style={styles.modalRow}>
                  <Image source={getCardImageSource(item.image)} style={styles.modalRowImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalRowTitle}>{item.title}</Text>
                    <Text style={styles.modalRowDesc}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  mediaCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  heroImage: {
    height: 240,
    width: '100%',
  },
  heroImageRadius: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: '#fff',
    fontWeight: '600',
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
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  priceCopy: {
    flex: 1,
    paddingRight: 8,
    minWidth: '55%',
  },
  vehicleWrapper: {
    flexShrink: 0,
    minWidth: 130,
    maxWidth: '42%',
    alignItems: 'flex-end',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0f172a',
  },
  priceSubText: {
    marginTop: 4,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-end',
    maxWidth: '100%',
  },
  vehiclePillText: {
    color: '#1d4ed8',
    fontWeight: '600',
    textTransform: 'capitalize',
    flexShrink: 1,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  overviewItem: {
    flexBasis: '32%',
    minWidth: 100,
    backgroundColor: '#e8f2ff',
    padding: 14,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#c7ddff',
  },
  overviewLabel: {
    fontSize: 13,
    color: '#1d4ed8',
    letterSpacing: 0,
    fontWeight: '600',
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAction: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingHorizontal: 4,
  },
  quickIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickLabel: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#92400e',
    fontSize: 13,
    flex: 1,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tabPill: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: '#1453b4',
    borderColor: '#0f3f87',
  },
  tabPillText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  tabPillTextActive: {
    color: '#fff',
  },
  tabContentWrapper: {
    minHeight: 180,
  },
  tabSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
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
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  featureRowText: {
    fontSize: 15,
    color: '#0f172a',
    flex: 1,
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
  footer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  subscribeButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropSpacer: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalSectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  modalRowImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  modalRowTitle: {
    fontWeight: '600',
    color: '#0f172a',
  },
  modalRowDesc: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
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
