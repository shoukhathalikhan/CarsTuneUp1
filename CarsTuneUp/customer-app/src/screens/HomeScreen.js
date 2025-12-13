import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Animated,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../config/api';
import AddressSelector from '../components/AddressSelector';
import VehicleSelector from '../components/VehicleSelector';
import FeedbackModal from '../components/FeedbackModal';
import FeedbackCarousel from '../components/FeedbackCarousel';

export default function HomeScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [recentJobs, setRecentJobs] = useState([]);
  
  // Animation values
  const priceAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const [currentPrice, setCurrentPrice] = useState(150);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const promoScrollRef = useRef(null);
  const SCREEN_WIDTH = Dimensions.get('window').width;
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRefreshTrigger, setFeedbackRefreshTrigger] = useState(0);

  const WHITE_CAR_IMAGE = require('../../assets/White-Car-HD-Cart.jpg');
  const CAR_INSURANCE_IMAGE = require('../../assets/car_insurance.jpg');
  const HERO_BG_IMAGE = require('../../assets/BG_IMAGE.jpg');

  const PRIMARY_CARDS = [
    {
      key: 'car-shower',
      title: 'Car Shower',
      description: 'Professional doorstep wash with curated plans',
      badge: 'Car Wash & Care',
      accent: '#1453b4',
      image: WHITE_CAR_IMAGE,
      onPress: () => navigation.navigate('CarWashPlans'),
    },
    {
      key: 'car-insurance',
      title: 'Car Insurance',
      description: 'Instant quotes with comprehensive coverage',
      badge: 'Protect & Drive',
      accent: '#0f9d58',
      image: CAR_INSURANCE_IMAGE,
      onPress: () => navigation.navigate('Insurance'),
    },
  ];

  const PROMO_IMAGE = require('../../assets/Promotion_banner.jpg');

  const PROMO_SLIDES = [
    {
      id: 'wash-premium',
      label: 'Premium Wash',
      price: '150',
      image: PROMO_IMAGE,
      caption: 'Starts from just',
    },
    {
      id: 'detailing-plus',
      label: 'Premium Wash',
      price: '200',
      image: PROMO_IMAGE,
      caption: 'SUV/MUV',
    },
  ];

  // Helper function to format frequency display
  const formatFrequency = (freq) => {
    const displayNames = {
      'daily': 'Daily',
      '2-days-once': '2 Days Once',
      '3-days-once': '3 Days Once',
      'weekly-once': 'Weekly Once',
      'one-time': 'One Time'
    };
    return displayNames[freq] || freq;
  };

  useEffect(() => {
    fetchServices();
    fetchRecentJobs();
    startAnimations();
    fetchNotificationCount();
  }, []);

  const fetchRecentJobs = async () => {
    try {
      const response = await api.get('/jobs/recent-works');
      
      const jobs = response.data.data.jobs || [];
      console.log(`📋 Total recent works found: ${jobs.length}`);
      
      setRecentJobs(jobs);
      console.log(`✅ Set ${jobs.length} recent works for display`);
    } catch (error) {
      console.error('Error fetching recent works:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromoIndex((prev) => {
        const nextIndex = (prev + 1) % PROMO_SLIDES.length;
        if (promoScrollRef.current) {
          promoScrollRef.current.scrollTo({
            x: nextIndex * SCREEN_WIDTH,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [SCREEN_WIDTH]);

  // Periodically refresh services and notification count to keep the home screen feeling live
  useEffect(() => {
    const interval = setInterval(() => {
      fetchServices();
      fetchNotificationCount();
    }, 60000); // every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchNotificationCount = async () => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await api.get('/notifications/unread-count');
      // setUnreadNotifications(response.data.count);
      
      // Mock unread count - simulate 2 unread notifications
      setUnreadNotifications(2);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setUnreadNotifications(0);
    }
  };
  
  const startAnimations = () => {
    // Slide animation for cards
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Fade animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
    fetchNotificationCount();
  };

  const handlePromoScroll = (event) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const index = Math.round(contentOffset.x / layoutMeasurement.width);
    if (!Number.isNaN(index)) {
      setActivePromoIndex(index);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1453b4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Hero Header with Location & Vehicle selectors */}
      <ImageBackground
        source={HERO_BG_IMAGE}
        style={styles.heroHeader}
        imageStyle={styles.heroHeaderImage}
        resizeMode="contain"
      >
        <View style={styles.heroOverlay}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroSelectorLeft}>
              <AddressSelector />
            </View>
            <View style={styles.heroSelectorRight}>
              <VehicleSelector />
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Featured Service Cards */}
      <Animated.View
        style={[
          styles.featuredCardsWrapper,
          {
            opacity: fadeAnimation,
            transform: [
              {
                translateY: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
      >
        {PRIMARY_CARDS.map((card) => (
          <TouchableOpacity
            key={card.key}
            style={styles.featuredCard}
            activeOpacity={0.92}
            onPress={card.onPress}
          >
            <View style={[styles.featuredBadgePill, { backgroundColor: `${card.accent}15` }]}> 
              <Ionicons name={card.key === 'car-shower' ? 'water' : 'shield-checkmark'} size={16} color={card.accent} />
              <Text style={[styles.featuredBadgeText, { color: card.accent }]}>{card.badge.toUpperCase()}</Text>
            </View>
            <View style={styles.featuredTextBlock}>
              <Text style={styles.featuredTitle}>{card.title}</Text>
              <Text style={styles.featuredSubtitle}>{card.description}</Text>
            </View>
            <Image
              source={typeof card.image === 'number' ? card.image : { uri: card.image }}
              style={styles.featuredImage}
              resizeMode="contain"
            />
            <View style={styles.cardArrowContainer}>
              <Ionicons name="chevron-forward" size={20} color="#1453b4" />
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Promo Slider */}
      <View style={styles.promoSliderSection}>
        <Text style={styles.promoHeaderTitle}>Introductory Offers</Text>
        <ScrollView
          ref={promoScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handlePromoScroll}
        >
          {PROMO_SLIDES.map((slide) => {
            const imageSource = typeof slide.image === 'number' ? slide.image : { uri: slide.image };
            return (
            <ImageBackground
              key={slide.id}
              source={imageSource}
              style={styles.promoSlide}
              imageStyle={styles.promoSlideImage}
              resizeMode="contain"
            >
              <LinearGradient colors={['rgba(15,23,42,0.85)', 'rgba(5,5,5,0.35)']} style={styles.promoSlideOverlay}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoLabel}>{slide.label.toUpperCase()}</Text>
                  <Text style={styles.promoCaption}>{slide.caption.toUpperCase()}</Text>
                  <Text style={styles.promoPriceText}>{`STARTS AT ₹${slide.price}`}</Text>
                </View>
                <Ionicons name="sparkles" size={28} color="#FFFFFF" />
              </LinearGradient>
            </ImageBackground>
          );
          })}
        </ScrollView>
        <View style={styles.promoIndicators}>
          {PROMO_SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[
                styles.promoDot,
                activePromoIndex === index && styles.promoDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Promotional Section */}
      <View style={styles.promoSection}>
        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>"Explore Premium Car Wash"</Text>
          <View style={styles.modernTagsContainer}>
            <View style={styles.modernTag}>
              <View style={styles.tagIconContainer}>
                <Ionicons name="pricetag" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.modernTagText}>Introductory Offer</Text>
            </View>
            <View style={styles.modernTag}>
              <View style={styles.tagIconContainer}>
                <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.modernTagText}>Professional Service</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Before/After Photos Section */}
      {recentJobs.length > 0 && (
        <View style={styles.photosSection}>
          <Text style={styles.photosSectionTitle}>Recent Work</Text>
          <Text style={styles.photosSectionSubtitle}>See our professional car wash results</Text>

          {(() => {
            const job = recentJobs[0];
            if (!job) return null;

            return (
              <View key={job._id} style={styles.photoCard}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    job.subscriptionId
                      ? navigation.navigate('SubscriptionDetail', {
                          subscriptionId: job.subscriptionId,
                          openJobId: job._id,
                        })
                      : null
                  }
                >
                  <View style={styles.photoCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.photoServiceName}>{job.serviceId?.name || 'Car Wash'}</Text>
                      <Text style={styles.photoEmployeeName}>
                        {job.employeeId?.userId?.name ? `By ${job.employeeId.userId.name}` : 'By Assigned Employee'}
                      </Text>
                    </View>
                    <Text style={styles.photoDate}>
                      {job.completedDate
                        ? new Date(job.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : ''}
                    </Text>
                  </View>
                </TouchableOpacity>

                {job.beforePhotos?.length > 0 && job.afterPhotos?.length > 0 && (
                  <View style={styles.pairedSliderWrap}>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={SCREEN_WIDTH - 64}
                      decelerationRate="fast"
                    >
                      {Array.from({
                        length: Math.min(3, job.beforePhotos.length, job.afterPhotos.length),
                      }).map((_, idx) => (
                        <View key={`pair-${job._id}-${idx}`} style={[styles.pairedSlide, { width: SCREEN_WIDTH - 64 }]}>
                          <View style={styles.pairedRow}>
                            <View style={styles.pairedCell}>
                              <Image
                                source={{ uri: job.beforePhotos[idx] }}
                                style={styles.pairedImage}
                                onError={(error) => console.log('Customer app before photo load error:', error)}
                              />
                              <Text style={styles.photoLabel}>Before</Text>
                            </View>
                            <View style={styles.pairedCell}>
                              <Image
                                source={{ uri: job.afterPhotos[idx] }}
                                style={styles.pairedImage}
                                onError={(error) => console.log('Customer app after photo load error:', error)}
                              />
                              <Text style={styles.photoLabel}>After</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.photoFooter}
                  activeOpacity={0.9}
                  onPress={() =>
                    job.subscriptionId
                      ? navigation.navigate('SubscriptionDetail', {
                          subscriptionId: job.subscriptionId,
                          openJobId: job._id,
                        })
                      : null
                  }
                >
                  <Ionicons name="eye-outline" size={16} color="#1453b4" />
                  <Text style={styles.viewPhotosText}>View Details</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      )}

      <View style={styles.insurancePromo}>
        <Ionicons name="shield-checkmark" size={48} color="#1453b4" />
        <Text style={styles.insuranceTitle}>Need Car Insurance?</Text>
        <Text style={styles.insuranceText}>
          Get instant quotes and comprehensive coverage for your vehicle
        </Text>
        <TouchableOpacity
          style={styles.insuranceButton}
          onPress={() => navigation.navigate('Insurance')}
        >
          <Text style={styles.insuranceButtonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Section */}
      <View style={styles.feedbackSection}>
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => setShowFeedbackModal(true)}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
          <Text style={styles.feedbackButtonText}>Share Your Feedback</Text>
        </TouchableOpacity>
        
        <FeedbackCarousel refreshTrigger={feedbackRefreshTrigger} />
      </View>
      </ScrollView>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={() => {
          setFeedbackRefreshTrigger(prev => prev + 1);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  heroHeader: {
    width: '100%',
    minHeight: 320,
    position: 'relative',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroOverlay: {
    width: '100%',
    paddingTop: 52,
    paddingBottom: 32,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  heroHeaderImage: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    resizeMode: 'contain',
  },
  heroTopRow: {
    marginTop: 4,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  heroSelectorLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroSelectorRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  notificationButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
    zIndex: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1453b4',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroLogo: {
    width: 160,
    height: 72,
    borderRadius: 18,
  },
  heroTagline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 10,
  },
  heroSubtext: {
    fontSize: 13,
    color: '#E3F2FD',
    marginTop: 4,
  },
  featuredCardsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 4,
    flexDirection: 'row',
    gap: 8,
    marginTop: -48,
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  featuredBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    marginBottom: 12,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  featuredTextBlock: {
    marginBottom: 12,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  featuredSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
  },
  featuredImage: {
    width: '100%',
    height: 70,
  },
  cardArrowContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 83, 180, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoSliderSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  promoHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  promoSlide: {
    width: Dimensions.get('window').width - 32,
    height: 80,
    borderRadius: 22,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  promoSlideImage: {
    borderRadius: 22,
  },
  promoSlideOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  promoLabel: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#BBDEFB',
    fontWeight: '700',
  },
  promoCaption: {
    fontSize: 11,
    color: '#E5E7EB',
    marginTop: 4,
    letterSpacing: 1,
  },
  promoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  promoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  promoDotActive: {
    backgroundColor: '#1453b4',
    width: 18,
  },
  promoPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  promoSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  promoCard: {
    borderRadius: 16,
    padding: 20,
    minWidth: '100%',
    alignSelf: 'stretch',
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4B5563',
    marginBottom: 8,
    textAlign: 'center',
    flexWrap: 'nowrap',
    flexShrink: 1,
  },
  promoSubtitle: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  promoFeatures: {
    marginBottom: 16,
    alignItems: 'center',
  },
  modernTagsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  modernTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1453b4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagIconContainer: {
    backgroundColor: '#1453b4',
    borderRadius: 12,
    padding: 4,
    marginRight: 8,
  },
  modernTagText: {
    fontSize: 13,
    color: '#1453b4',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  promoFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    width: '100%',
    justifyContent: 'center',
  },
  promoFeatureText: {
    fontSize: 14,
    color: '#1453b4',
    marginLeft: 8,
    fontWeight: '600',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E7F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  howItWorksSection: {
    padding: 16,
    backgroundColor: '#F0F8FF',
    marginTop: 8,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1453b4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  atDoorBadge: {
    flexDirection: 'row',
    backgroundColor: '#28A745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'center',
  },
  atDoorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 180,
  },
  serviceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  viewAllPlansButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E7F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  glowingBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1453b4',
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  priceTag: {
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1453b4',
  },
  frequencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  frequency: {
    fontSize: 12,
    color: '#1453b4',
    textTransform: 'capitalize',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  serviceTile: {
    width: '48%',
    borderRadius: 18,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceTileImage: {
    width: '100%',
    height: 110,
  },
  serviceTileContent: {
    padding: 12,
  },
  serviceTileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  serviceTilePrice: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#1453b4',
  },
  serviceTileMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#475569',
    textTransform: 'capitalize',
  },
  insurancePromo: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insuranceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 12,
    marginBottom: 8,
  },
  insuranceText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 16,
  },
  insuranceButton: {
    backgroundColor: '#1453b4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  insuranceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackSection: {
    marginVertical: 8,
  },
  feedbackButton: {
    backgroundColor: '#1453b4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  photosSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photosSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  photosSectionSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
  },
  photosScrollView: {
    marginHorizontal: -8,
  },
  photoCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 0,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  photoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  photoDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  pairedSliderWrap: {
    width: '100%',
    marginTop: 6,
  },
  pairedSlide: {
    paddingVertical: 4,
  },
  pairedRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pairedCell: {
    flex: 1,
    alignItems: 'center',
  },
  pairedImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    backgroundColor: '#EEF2F7',
  },
  photoComparison: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  photoItem: {
    flex: 1,
    alignItems: 'center',
  },
  photoSliderContent: {
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    marginBottom: 4,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1453b4',
    textAlign: 'center',
  },
  photoCount: {
    fontSize: 10,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 2,
  },
  photoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  viewPhotosText: {
    fontSize: 14,
    color: '#1453b4',
    marginLeft: 6,
    fontWeight: '600',
  },
  photoPlaceholder: {
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  photoEmployeeName: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 4,
  },
});
