import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import api from '../config/api';
import { wp, hp, rfs, getStatusBarHeight, getBottomSpace, spacing } from '../utils/responsive';

const BRAND_LOGO = require('../../assets/logo.jpg');

const STEPS = [
  {
    key: 'location',
    title: 'Confirm Service Location',
    description: 'Pick an existing address or add a new service location.',
    icon: 'location'
  },
  {
    key: 'payment',
    title: 'Select Payment Method',
    description: 'Choose how you would like to complete your subscription.',
    icon: 'card'
  }
];

const PAYMENT_METHODS = [
  { key: 'upi', label: 'UPI (Google Pay / PhonePe / PayTM)', icon: 'logo-usd' },
  { key: 'card', label: 'Credit / Debit Card', icon: 'card' },
  { key: 'cod', label: 'Pay on First Wash (Cash / UPI)', icon: 'cash' }
];

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '—';
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return '—';
  return `₹${numeric.toLocaleString('en-IN', {
    minimumFractionDigits: numeric % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
};

const formatDate = (date) => {
  if (!date) return 'Select date';
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function SubscriptionBookingScreen({ navigation, route }) {
  const { service, origin } = route.params ?? {};
  const { addresses, currentAddress, selectAddress } = useApp();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState(currentAddress?.id || null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (currentAddress?.id) {
        setSelectedAddressId(currentAddress.id);
      }
    }, [currentAddress?.id])
  );

  const planSummary = useMemo(() => {
    if (!service) {
      return {
        title: 'Car Wash Subscription',
        frequency: 'Flexible schedule',
        price: '—'
      };
    }

    return {
      title: service.name,
      frequency: service.frequency,
      price: formatCurrency(service.price)
    };
  }, [service]);


  const handleGoBack = () => {
    if (origin === 'serviceDetail') {
      navigation.navigate('ServiceDetail', { service, action: 'book' });
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CarWashPlans');
    }
  };

  const openAddressSelection = () => {
    navigation.navigate('AddressSelection', { fromBooking: true });
  };

  const handleSelectAddress = async (addressId) => {
    setSelectedAddressId(addressId);
    await selectAddress(addressId);
  };

  const handleConfirmBooking = async () => {
    const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
    if (!selectedAddress || !paymentMethod || !service) {
      Alert.alert('Incomplete Details', 'Please complete all steps before confirming.');
      return;
    }

    setIsLoading(true);
    try {
      // Generate a temporary payment ID for development
      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create subscription via API using pre-configured client
      const response = await api.post('/subscriptions', {
        serviceId: service._id,
        paymentId: paymentId
      });

      Alert.alert(
        'Subscription Created Successfully',
        'Your subscription has been created with "Pending" status. Our admin team will review and assign an employee to you shortly.',
        [{ text: 'Done', onPress: () => navigation.navigate('MainTabs', { screen: 'Subscriptions' }) }]
      );
    } catch (error) {
      console.error('Error creating subscription:', error);
      Alert.alert(
        'Error',
        error.message || error.response?.data?.message || 'Failed to create subscription. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepCard = (step, index) => {
    const isActive = index === activeStep;
    const isCompleted = index < activeStep;

    return (
      <TouchableOpacity
        key={step.key}
        style={[styles.stepCard, isActive && styles.stepCardActive]}
        activeOpacity={0.8}
        onPress={() => setActiveStep(index)}
      >
        <View style={[styles.stepBadge, isActive && styles.stepBadgeActive, isCompleted && styles.stepBadgeCompleted]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={16} color="#0b1f4b" />
          ) : (
            <Text style={[styles.stepBadgeText, isActive && styles.stepBadgeTextActive]}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.stepInfo}>
          <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>
        <Ionicons name={isActive ? 'chevron-down' : 'chevron-forward'} size={18} color="#3b4a68" />
      </TouchableOpacity>
    );
  };

  const renderLocationSelector = () => (
    <View style={styles.cardSection}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.sectionHeading}>Service Address</Text>
          <Text style={styles.sectionSubheading}>Select a saved address or add a new one.</Text>
        </View>
        <TouchableOpacity style={styles.addLocationButton} onPress={openAddressSelection}>
          <Ionicons name="add" size={18} color="#1453b4" />
          <Text style={styles.addLocationText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.emptyAddresses}>
          <Ionicons name="home-outline" size={24} color="#94a3b8" />
          <Text style={styles.emptyAddressesText}>No addresses yet. Add one to continue.</Text>
        </View>
      ) : (
        addresses.map((address) => {
          const isSelected = selectedAddressId === address.id;
          return (
            <TouchableOpacity
              key={address.id}
              style={[styles.addressTile, isSelected && styles.addressTileSelected]}
              onPress={() => handleSelectAddress(address.id)}
              activeOpacity={0.85}
            >
              <View style={styles.addressRadio}>
                {isSelected && <View style={styles.addressRadioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>{address.label || 'Primary Address'}</Text>
                <Text style={styles.addressValue} numberOfLines={2}>
                  {[address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                </Text>
              </View>
              <Ionicons name="location" size={20} color={isSelected ? '#1453b4' : '#94a3b8'} />
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  const renderPaymentSelector = () => (
    <View style={styles.cardSection}>
      <Text style={styles.sectionHeading}>Payment Preference</Text>
      <Text style={styles.sectionSubheading}>
        We will initiate the payment using your preferred mode when the subscription is confirmed.
      </Text>

      {PAYMENT_METHODS.map((method) => {
        const isSelected = paymentMethod === method.key;
        return (
          <TouchableOpacity
            key={method.key}
            style={[styles.paymentTile, isSelected && styles.paymentTileSelected]}
            onPress={() => setPaymentMethod(method.key)}
            activeOpacity={0.85}
          >
            <View style={styles.paymentIconWrapper}>
              <Ionicons name={method.icon} size={20} color={isSelected ? '#0f172a' : '#1453b4'} />
            </View>
            <Text style={[styles.paymentLabel, isSelected && styles.paymentLabelSelected]}>{method.label}</Text>
            <View style={styles.paymentRadio}>
              {isSelected && <View style={styles.paymentRadioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderActiveStepContent = () => {
    switch (STEPS[activeStep].key) {
      case 'location':
        return renderLocationSelector();
      case 'payment':
      default:
        return renderPaymentSelector();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0b1f4b', '#1453b4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={BRAND_LOGO} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>Complete Your Subscription</Text>
          <Text style={styles.headerSubtitle}>Three quick steps to schedule your premium car wash plan.</Text>
        </View>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Selected Plan</Text>
          <Text style={styles.summaryTitle}>{planSummary.title}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Ionicons name="repeat" size={14} color="#1453b4" />
              <Text style={styles.summaryPillText}>{planSummary.frequency}</Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: 'rgba(20,83,180,0.12)' }]}>
              <Ionicons name="pricetag" size={14} color="#1453b4" />
              <Text style={styles.summaryPillText}>{planSummary.price}</Text>
            </View>
          </View>
        </View>

        <View style={styles.stepsWrapper}>
          {STEPS.map((step, index) => renderStepCard(step, index))}
        </View>

        {renderActiveStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerHeadline}>{STEPS[activeStep].title}</Text>
          <Text style={styles.footerCaption}>Step {activeStep + 1} of {STEPS.length}</Text>
        </View>

        {activeStep < STEPS.length - 1 ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1))}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>Next Step</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} 
            onPress={handleConfirmBooking} 
            activeOpacity={0.9}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Confirm &amp; Continue</Text>
                <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f5fb'
  },
  heroHeader: {
    paddingTop: 52,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginTop: -4
  },
  brandLogo: {
    width: 130,
    height: 44,
    marginBottom: 6
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700'
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#1453b4',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6c7a93'
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1f4b',
    marginTop: 6
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 31, 75, 0.08)'
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b1f4b'
  },
  stepsWrapper: {
    gap: 12
  },
  stepCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  stepCardActive: {
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 180, 0.35)'
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,31,75,0.35)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBadgeActive: {
    backgroundColor: 'rgba(20,83,180,0.15)',
    borderColor: '#1453b4'
  },
  stepBadgeCompleted: {
    backgroundColor: 'rgba(56,189,248,0.2)',
    borderColor: 'rgba(56,189,248,0.5)'
  },
  stepBadgeText: {
    fontWeight: '700',
    color: '#374151'
  },
  stepBadgeTextActive: {
    color: '#1453b4'
  },
  stepInfo: {
    flex: 1
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2a44'
  },
  stepTitleActive: {
    color: '#1453b4'
  },
  stepDescription: {
    fontSize: 12,
    color: '#6c7a93',
    marginTop: 4,
    lineHeight: 16
  },
  cardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1f4b'
  },
  sectionSubheading: {
    fontSize: 13,
    color: '#6c7a93',
    marginTop: 6,
    lineHeight: 18
  },
  dateTile: {
    marginTop: 16,
    backgroundColor: '#f3f6ff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  dateIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1453b4',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  dateLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 1
  },
  dateValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0b1f4b'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap'
  },
  sectionHeaderCopy: {
    flex: 1,
    minWidth: 200
  },
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,83,180,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  addLocationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1453b4'
  },
  emptyAddresses: {
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#f5f7fb',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)'
  },
  emptyAddressesText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center'
  },
  addressTile: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8faff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  addressTileSelected: {
    borderColor: 'rgba(20,83,180,0.45)',
    backgroundColor: '#ffffff',
    shadowColor: '#1453b4',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  addressRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1453b4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addressRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1453b4'
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2a44',
    marginBottom: 4
  },
  addressValue: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18
  },
  paymentTile: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8faff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  paymentTileSelected: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(20,83,180,0.45)',
    shadowColor: '#1453b4',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  paymentIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(20,83,180,0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  paymentLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2a44'
  },
  paymentLabelSelected: {
    color: '#0b1f4b'
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1453b4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1453b4'
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + getBottomSpace(),
    borderRadius: 14,
    shadowColor: '#1453b4',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5
  },
  footerInfo: {
    flex: 1,
    marginRight: 16
  },
  footerHeadline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b1f4b'
  },
  footerCaption: {
    fontSize: 12,
    color: '#6c7a93',
    marginTop: 4
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1453b4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#1453b4',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  primaryButtonDisabled: {
    opacity: 0.6
  }
});
