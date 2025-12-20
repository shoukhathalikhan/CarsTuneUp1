import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import api from '../config/api';
import { wp, hp, rfs, getStatusBarHeight, getBottomSpace, spacing } from '../utils/responsive';

const formatCurrency = (amount) => {
  const numeric = Number(amount || 0);
  return `₹${numeric.toLocaleString('en-IN', {
    minimumFractionDigits: numeric % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
};

export default function CartScreen({ navigation }) {
  const { cartItems, getCartSummary, removeFromCart } = useCart();
  const { currentAddress, addresses, selectAddress } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const summary = getCartSummary();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserPhone(user.phone || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding.');
      return;
    }

    if (!currentAddress) {
      Alert.alert('Address Required', 'Please select a delivery address to continue.');
      navigation.navigate('AddressSelection', { fromCart: true });
      return;
    }

    if (!userPhone) {
      Alert.alert(
        'Phone Number Required',
        'Please add your phone number to proceed with the booking. This is required for service coordination.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Phone', onPress: () => setShowPhoneModal(true) }
        ]
      );
      return;
    }

    navigation.navigate('OrderReview');
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (phoneInput.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsSavingPhone(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await api.put('/users/profile', 
        { phone: phoneInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = response.data.data;
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUserPhone(phoneInput);
      setShowPhoneModal(false);
      Alert.alert('Success', 'Phone number added successfully!');
    } catch (error) {
      console.error('Error saving phone:', error);
      Alert.alert('Error', 'Failed to save phone number. Please try again.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleEditPhone = () => {
    setPhoneInput(userPhone);
    setShowPhoneModal(true);
  };

  const handleEditAddress = () => {
    setShowAddressModal(true);
  };

  const handleSelectAddress = async (address) => {
    await selectAddress(address.id);
    setShowAddressModal(false);
  };

  const handleAddNewAddress = () => {
    setShowAddressModal(false);
    navigation.navigate('LocationAddition', { fromCart: true });
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add services to get started</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Services')}
          >
            <Text style={styles.continueButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.phoneCard}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressLabel}>Contact Number:</Text>
            <TouchableOpacity onPress={handleEditPhone}>
              <Ionicons name="pencil" size={18} color="#1453b4" />
            </TouchableOpacity>
          </View>
          {userPhone ? (
            <Text style={styles.phoneText}>{userPhone}</Text>
          ) : (
            <TouchableOpacity 
              style={styles.addPhoneButton}
              onPress={() => setShowPhoneModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#EF4444" />
              <Text style={styles.addPhoneText}>Add Phone Number (Required)</Text>
            </TouchableOpacity>
          )}
        </View>

        {currentAddress && (
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressLabel}>Delivery To:</Text>
              <TouchableOpacity onPress={handleEditAddress}>
                <Ionicons name="pencil" size={18} color="#1453b4" />
              </TouchableOpacity>
            </View>
            <Text style={styles.addressText}>
              {currentAddress.label || 'Primary Address'}
            </Text>
            <Text style={styles.addressDetails} numberOfLines={2}>
              {[currentAddress.street, currentAddress.city, currentAddress.state, currentAddress.zipCode]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        )}

        {cartItems.map((item) => (
          <View key={item.id} style={styles.cartItemCard}>
            <View style={styles.cartItemHeader}>
              <View>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <Text style={styles.vehicleType}>{item.vehicleType}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Service Price</Text>
                <Text style={styles.priceValue}>{formatCurrency(item.baseServicePrice)}</Text>
              </View>

              {item.selectedAddOns.length > 0 && (
                <>
                  <Text style={styles.addOnsTitle}>Add-ons</Text>
                  {item.selectedAddOns.map((addon, index) => (
                    <View key={index} style={styles.addOnRow}>
                      <Text style={styles.addOnName}>{addon.name}</Text>
                      <Text style={styles.addOnPrice}>{formatCurrency(addon.price)}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>
        ))}

        <View style={styles.priceSummaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Price</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.baseTotal)}</Text>
          </View>

          {summary.addOnsTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Add-ons Total</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.addOnsTotal)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalAmount)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Final Payable Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(summary.totalAmount)}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleProceedToCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Location</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select a delivery location to see product availability, offers and discounts.
            </Text>

            <ScrollView style={styles.addressesList} showsVerticalScrollIndicator={false}>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressOption,
                    currentAddress?.id === address.id && styles.addressOptionSelected
                  ]}
                  onPress={() => handleSelectAddress(address)}
                >
                  <View style={styles.addressOptionContent}>
                    <Text style={styles.addressOptionName}>
                      {address.label || 'Address'}
                    </Text>
                    <Text style={styles.addressOptionDetails} numberOfLines={2}>
                      {[address.street, address.city, address.state, address.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>
                  {currentAddress?.id === address.id && (
                    <View style={styles.addressCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color="#1453b4" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.addNewAddressButton}
              onPress={handleAddNewAddress}
            >
              <Ionicons name="add-circle" size={24} color="#1453b4" />
              <Text style={styles.addNewAddressText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPhoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.phoneModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Phone Number</Text>
              <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <Text style={styles.phoneModalSubtitle}>
              Your phone number is required for service coordination and updates.
            </Text>

            {phoneInput.length > 0 && (
              <View style={styles.phonePreviewContainer}>
                <Text style={styles.phonePreviewLabel}>Phone Number:</Text>
                <Text style={styles.phonePreviewText}>
                  {phoneInput.length >= 10 
                    ? `${phoneInput.slice(0, 5)} ${phoneInput.slice(5, 10)}`
                    : phoneInput}
                </Text>
                {phoneInput.length === 10 && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.checkIcon} />
                )}
              </View>
            )}

            <TextInput
              style={styles.phoneInput}
              placeholder="Enter 10-digit phone number"
              placeholderTextColor="#9CA3AF"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.savePhoneButton, isSavingPhone && styles.buttonDisabled]}
              onPress={handleSavePhone}
              disabled={isSavingPhone}
            >
              {isSavingPhone ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.savePhoneButtonText}>Save Phone Number</Text>
              )}
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addressCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  cartItemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  vehicleType: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  addOnsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 8,
  },
  addOnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  addOnName: {
    fontSize: 13,
    color: '#4B5563',
  },
  addOnPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1453b4',
  },
  priceSummaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
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
  checkoutButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  addressesList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  addressOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  addressOptionSelected: {
    borderColor: '#1453b4',
    backgroundColor: '#EFF6FF',
  },
  addressOptionContent: {
    flex: 1,
  },
  addressOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  addressOptionDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  addressCheckmark: {
    marginLeft: 8,
  },
  addNewAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1453b4',
    marginBottom: 20,
    gap: 8,
  },
  addNewAddressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1453b4',
  },
  phoneCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  addPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addPhoneText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  phoneModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  phoneModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  phoneInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
  },
  savePhoneButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePhoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
