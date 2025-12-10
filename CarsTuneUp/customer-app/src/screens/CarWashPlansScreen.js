import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Modal,
  Dimensions
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { useApp } from '../context/AppContext';

const HERO_BANNER = require('../../assets/carztuneup_promotion.jpg');
const SERVICE_IMAGE_FALLBACK = require('../../assets/sedan_cars.jpeg');

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

const resolveImageSource = (url) => {
  if (url && url.startsWith('http')) {
    return { uri: url };
  }

  if (url) {
    const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return { uri: `${base}${normalizedPath}` };
  }

  return SERVICE_IMAGE_FALLBACK;
};

const normalizeVehicleType = (raw) => {
  if (!raw) return 'hatchback-sedan';
  const value = raw.toString().toLowerCase();
  if (value.includes('suv') || value.includes('muv')) {
    return 'suv-muv';
  }
  return 'hatchback-sedan';
};

export default function CarWashPlansScreen({ navigation }) {
  const { currentVehicle, refreshVehicles } = useApp();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const currentVehicleType = useMemo(
    () => normalizeVehicleType(currentVehicle?.type),
    [currentVehicle?.type]
  );

  const hasVehicleSelection = Boolean(currentVehicle?.brand && currentVehicle?.model);
  // Removed vehicleLabel as it's no longer needed

  const fetchServices = useCallback(async () => {
    if (!hasVehicleSelection) {
      setServices([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const params = {};
      
      if (currentVehicle?.brand && currentVehicle?.model) {
        params.userBrand = currentVehicle.brand;
        params.userModel = currentVehicle.model;
      }
      
      const response = await api.get('/services', { params });
      const allServices = response.data?.data?.services || [];
      const filtered = allServices.filter(
        (service) => normalizeVehicleType(service.vehicleType) === currentVehicleType
      );

      setServices(filtered);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentVehicle, currentVehicleType, hasVehicleSelection]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      await refreshVehicles();
      fetchServices();
    });

    return unsubscribe;
  }, [navigation, refreshVehicles, fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const calculatePricePerWash = (service) => {
    if (!service.price) return 0;
    
    // For one-time services, show the full price
    if (service.frequency === 'one-time') {
      return service.price;
    }
    
    // Calculate washes based on frequency
    let washesPerMonth = 1;
    switch (service.frequency) {
      case 'daily':
        washesPerMonth = 30;
        break;
      case '2-days-once':
        washesPerMonth = 15;
        break;
      case '3-days-once':
        washesPerMonth = 10;
        break;
      case 'weekly-once':
        washesPerMonth = 4;
        break;
      case 'one-time':
        washesPerMonth = 1;
        break;
      default:
        washesPerMonth = 1;
    }
    
    const pricePerWash = service.price / washesPerMonth;
    return Math.round(pricePerWash * 100) / 100; // Round to 2 decimal places
  };

  const getWashFrequencyText = (service) => {
    if (service.frequency === 'one-time') {
      return '1 wash';
    }
    
    switch (service.frequency) {
      case 'daily':
        return '30 washes/month';
      case '2-days-once':
        return '15 washes/month';
      case '3-days-once':
        return '10 washes/month';
      case 'weekly-once':
        return '4 washes/month';
      default:
        return '1 wash/month';
    }
  };

  const handleBookNow = (service) => {
    navigation.navigate('ServiceDetail', { service, action: 'book' });
  };

  const handleLogout = () => {
    // Add your logout logic here
    navigation.navigate('Login'); // or whatever your login screen is called
  };

  const handlePlanPress = (service) => {
    setSelectedService(service);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedService(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1453b4" />
        <Text style={styles.loadingText}>Fetching plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1453b4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Shower Plans</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#1453b4" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View>
          <ImageBackground
            source={HERO_BANNER}
            style={styles.heroBanner}
            imageStyle={styles.heroBannerImage}
            resizeMode="cover"
          >
            <View style={styles.heroBannerOverlay}>
              <Text style={styles.heroBannerTitle}>
                {hasVehicleSelection
                  ? `${currentVehicle.brand} ${currentVehicle.model}`
                  : 'Choose Your Ride'}
              </Text>
              <Text style={styles.heroBannerSubtitle}>
                {hasVehicleSelection
                  ? 'Personalized wash plans with your model pricing'
                  : 'Add a vehicle to see curated plans'}
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.enhancedSection}>
            <Text style={styles.enhancedSectionTitle}>
              {hasVehicleSelection ? 'Choose Your Plan' : 'Select a Vehicle'}
            </Text>
            
            {!hasVehicleSelection ? (
              <View style={styles.emptyState}>
                <Ionicons name="car-sport-outline" size={32} color="#6C757D" />
                <Text style={styles.emptyStateText}>
                  Add a vehicle in your profile to view personalized plans.
                </Text>
                <TouchableOpacity
                  style={styles.addVehicleButton}
                  onPress={() => navigation.navigate('VehicleSelection', { fromHome: true })}
                >
                  <Text style={styles.addVehicleButtonText}>Select Vehicle</Text>
                </TouchableOpacity>
              </View>
            ) : services.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={28} color="#6C757D" />
                <Text style={styles.emptyStateText}>
                  No plans configured yet for this vehicle type.
                </Text>
              </View>
            ) : (
              services.map((service) => (
                <View key={service._id} style={styles.newPlanCard}>
                  <View style={styles.planCardLeft}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.pricePerWash}>₹{calculatePricePerWash(service)} / wash</Text>
                    <Text style={styles.washFrequency}>{getWashFrequencyText(service)}</Text>
                    
                    <Text style={styles.typesOfServicesLabel}>Types of Services</Text>
                    <View style={styles.featuresList}>
                      <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.featureItemText}>Exterior Foam Wash + Interior Vacuum Cleaning</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.featureItemText}>Dashboard Polish + Tyre Polish</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.featureItemText}>Glass Polish + Air Freshener</Text>
                      </View>
                    </View>
                    
                    <View style={styles.viewDetailsContainer}>
                      <TouchableOpacity 
                        style={styles.viewDetailsButton}
                        onPress={() => handlePlanPress(service)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.viewDetailsText}>View Details</Text>
                        <Ionicons name="chevron-forward" size={16} color="#1453b4" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.planCardRight}>
                    <View style={styles.imageContainer}>
                      <ImageBackground
                        source={resolveImageSource(service.imageURL)}
                        style={styles.serviceImage}
                        imageStyle={styles.serviceImageRadius}
                      >
                        <View style={styles.timeOverlay}>
                          <Ionicons name="time" size={14} color="#FFFFFF" />
                          <Text style={styles.timeText}>{service.duration || '--'} mins</Text>
                        </View>
                      </ImageBackground>
                    </View>
                    
                    <Text style={styles.oneTimeText}>{formatFrequency(service.frequency)}</Text>
                    
                    <View style={styles.ratingContainer}>
                      {[1, 2, 3, 4].map((star) => (
                        <Ionicons 
                          key={star} 
                          name="star" 
                          size={14} 
                          color="#FFC107" 
                        />
                      ))}
                      <Ionicons 
                        name="star-half" 
                        size={14} 
                        color="#FFC107" 
                      />
                      <Text style={styles.ratingValue}>4.5</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.bookNowButton}
                      onPress={() => handleBookNow(service)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bookNowText}>Book Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Special Offer Section Between Services */}
            <View style={styles.specialOfferSection}>
              <View style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <View style={styles.offerIconContainer}>
                    <Ionicons name="flame" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.offerTitle}>Limited Time Offer</Text>
                </View>
                <Text style={styles.offerMainText}>Extra 15% OFF</Text>
                <Text style={styles.offerSubText}>On all subscription plans</Text>
                <View style={styles.offerDivider} />
                <Text style={styles.offerNote}>Discount applied automatically at checkout</Text>
                <View style={styles.offerFooter}>
                  <Ionicons name="timer" size={16} color="#FFFFFF" />
                  <Text style={styles.offerFooterText}>Offer ends soon</Text>
                </View>
              </View>
            </View>
          </View>
        )

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Service Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header with Video */}
            <View style={styles.modalHeader}>
              <Video
                source={require('../../assets/Backgound_video.mp4')}
                style={styles.modalVideo}
                resizeMode="cover"
                shouldPlay
                isLooping
                isMuted
                rate={1.0}
                useNativeControls={false}
              />
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Modal Body with Service Details */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Service Details</Text>
                <Text style={styles.modalDescription}>{selectedService?.description}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Pricing</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.modalPrice}>₹{selectedService?.price}<Text style={styles.pricePeriod}> / month</Text></Text>
                  <View style={styles.frequencyChip}>
                    <Ionicons name="repeat" size={16} color="#1453b4" />
                    <Text style={styles.frequencyText}>{formatFrequency(selectedService?.frequency)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Duration</Text>
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={20} color="#1453b4" />
                  <Text style={styles.durationText}>{selectedService?.duration} minutes</Text>
                </View>
              </View>

              {selectedService?.features && selectedService.features.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Features</Text>
                  <View style={styles.featuresList}>
                    {selectedService.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.featureItemText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Benefits</Text>
                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="flower" size={16} color="#10B981" />
                    <Text style={styles.benefitItemText}>Free Air Freshener</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="shield-checkmark" size={16} color="#1453b4" />
                    <Text style={styles.benefitItemText}>Damage Protection</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.subscribeButton} onPress={() => {
                // Handle subscription logic here
                closeModal();
              }}>
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={{ height: 20 }} />
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
    backgroundColor: '#F7F9FC'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC'
  },
  loadingText: {
    marginTop: 12,
    color: '#6C757D'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2933'
  },
  scrollView: {
    flex: 1
  },
  heroCard: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 20,
    borderRadius: 0,
    overflow: 'hidden',
    height: 260,
    backgroundColor: '#000'
  },
  horizontalScrollView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  heroImage: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    gap: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeIndicatorDot: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    padding: 20,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.1)'
  },
  heroEyebrow: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20
  },
  airFreshenerBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    marginVertical: 16,
    borderRadius: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTextContainer: {
    flex: 1,
  },
  airFreshenerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1453b4',
    marginBottom: 2,
  },
  airFreshenerSubText: {
    fontSize: 14,
    color: '#4B5563',
  },
  leafIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1453b4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionHeader: {
    marginBottom: 20
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center'
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20
  },
  vehicleTiles: {
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 4,
    flexDirection: 'row',
    gap: 8,
    marginTop: 0,
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flex: 1,
    shadowColor: '#1453b4',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0,
    borderColor: 'transparent',
    minHeight: 140,
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
  featuredDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  featuredImage: {
    width: '100%',
    height: 75,
    borderRadius: 8,
  },
  featuredImageRadius: {
    borderRadius: 8,
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
  vehicleTile: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  vehicleTileImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  vehicleTileOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  vehicleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  vehicleTileContent: {
    alignItems: 'center',
  },
  vehicleTileTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2
  },
  vehicleTileSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500'
  },
  heroBanner: {
    marginHorizontal: 0,
    marginTop: 0,
    height: 220,
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 0,
  },
  heroBannerImage: {
    borderRadius: 0
  },
  heroBannerOverlay: {
    flex: 1,
    padding: 22,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.45)'
  },
  heroBannerEyebrow: {
    color: '#bfdbfe',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6
  },
  heroBannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700'
  },
  heroBannerSubtitle: {
    color: '#e2e8f0',
    marginTop: 6,
    fontSize: 14
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20
  },
  selectorContainer: {
    marginHorizontal: 16,
    marginTop: 24
  },
  selectorHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2933',
    marginBottom: 16
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  vehicleTile: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    aspectRatio: 1.55,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  vehicleTileImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end'
  },
  vehicleTileImageStyle: {
    borderRadius: 18
  },
  vehicleTileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 14,
    justifyContent: 'flex-end'
  },
  vehicleTileTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  vehicleTileSubtitle: {
    color: '#E5E7EB',
    fontSize: 12,
    marginTop: 4
  },
  bookingInfoCard: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: '#fff',
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e7ff'
  },
  bookingInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8
  },
  bookingInfoBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569'
  },
  whyChooseSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16
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
  specialOfferBanner: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  offerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 6,
  },
  offerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  offerDivider: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginVertical: 8,
  },
  offerNote: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  enhancedSection: {
    marginHorizontal: 16,
    marginTop: 4,
  },
  enhancedSectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1453b4',
    marginBottom: 20,
    textAlign: 'center',
  },
  enhancedPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7F3FF',
  },
  planContent: {
    flex: 1,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  discountedPrice: {
    flex: 1,
  },
  discountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  frequencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
  },
  benefitsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F8FF',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  benefitText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F8FF',
  },
  actionText: {
    fontSize: 15,
    color: '#1453b4',
    fontWeight: '600',
  },
  specialOfferSection: {
    marginHorizontal: 16,
    marginVertical: 20,
  },
  offerCard: {
    background: 'linear-gradient(135deg, #1453b4 0%, #2E7CD6 50%, #4A90E2 100%)',
    borderRadius: 16,
    padding: 20,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  offerMainText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  offerSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  offerDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginVertical: 8,
  },
  offerNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  offerFooter: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  offerFooterText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  heroBanner: {
    height: 180,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerInfo: {
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 4
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  emptyStateText: {
    marginTop: 8,
    color: '#6C757D',
    textAlign: 'center'
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden'
  },
  planImage: {
    height: 170,
    width: '100%'
  },
  planImageRadius: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18
  },
  planImageOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  planBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6
  },
  vehicleBadgeText: {
    color: '#bfdbfe',
    fontWeight: '600',
    fontSize: 12
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 15, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6
  },
  durationBadgeText: {
    color: '#bfdbfe',
    fontWeight: '500',
    fontSize: 12
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  planDescription: {
    fontSize: 13,
    color: '#F3F4F6',
    marginTop: 6
  },
  planBody: {
    padding: 18
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280'
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827'
  },
  priceSuffix: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400'
  },
  frequencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#bfdbfe'
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  featureText: {
    fontSize: 12,
    color: '#000000ff'
  },
  cardFooter: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tapHint: {
    fontSize: 13,
    color: '#6B7280'
  },
  // New Plan Card Styles
  newPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7F3FF',
    minHeight: 400,
    maxHeight: 440,
  },
  planCardLeft: {
    flex: 1.2,
    padding: 20,
    justifyContent: 'flex-start',
  },
  planCardRight: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    paddingTop: 20,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  pricePerWash: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  washFrequency: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  typesOfServicesLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  featuresList: {
    marginBottom: 12,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  featureItemText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flexShrink: 1,
    lineHeight: 20,
    flexWrap: 'wrap',
    fontWeight: '600',
    marginTop: 0,
  },
  viewDetailsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  viewDetailsText: {
    color: '#1453b4',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  imageContainer: {
    height: 120,
    width: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  serviceImageRadius: {
    borderRadius: 12,
  },
  timeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  oneTimeText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '700',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingStars: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  viewDetailsRightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    alignSelf: 'center',
    marginBottom: 8,
  },
  viewDetailsRightText: {
    color: '#1453b4',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  bookNowButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 70,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 120,
  },
  bookNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.98,
    height: Dimensions.get('window').height * 0.80,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    height: 200,
    position: 'relative',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  modalVideoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalServiceName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalServiceSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalBody: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
    paddingBottom: 40,
  },
  modalSection: {
    marginBottom: 28,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 14,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1453b4',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1453b4',
    marginLeft: 8,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  featureItemText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    fontWeight: 'bold',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  benefitItemText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  subscribeButton: {
    flexDirection: 'row',
    backgroundColor: '#1453b4',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
