import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';

const formatCurrency = (amount) => {
  const numeric = Number(amount || 0);
  return `₹${numeric.toLocaleString('en-IN', {
    minimumFractionDigits: numeric % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
};

export default function OrderReviewScreen({ navigation }) {
  const { cartItems, getCartSummary } = useCart();
  const { currentAddress, addresses, selectAddress } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const summary = getCartSummary();
  const cartItem = cartItems[0];

  const handleEditAddress = () => {
    setShowAddressModal(true);
  };

  const handleSelectAddress = async (address) => {
    await selectAddress(address.id);
    setShowAddressModal(false);
  };

  const handleAddNewAddress = () => {
    setShowAddressModal(false);
    navigation.navigate('LocationAddition', { fromOrderReview: true });
  };

  const handleMakePayment = async () => {
    if (!cartItem) {
      Alert.alert('Error', 'Cart is empty. Please add items before proceeding.');
      return;
    }

    setIsLoading(true);
    try {
      navigation.navigate('Payment', { orderData: cartItem });
    } catch (error) {
      Alert.alert('Error', 'Failed to proceed to payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!cartItem) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Review</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items in cart</Text>
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
        <Text style={styles.headerTitle}>Order Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentAddress && (
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View>
                <Text style={styles.addressTitle}>{currentAddress.label || 'Primary Address'}</Text>
                <Text style={styles.addressBadge}>Home</Text>
              </View>
              <TouchableOpacity onPress={handleEditAddress}>
                <Ionicons name="pencil" size={20} color="#1453b4" />
              </TouchableOpacity>
            </View>
            <Text style={styles.addressFullText} numberOfLines={4}>
              {[currentAddress.street, currentAddress.city, currentAddress.state, currentAddress.zipCode]
                .filter(Boolean)
                .join(', ')}
            </Text>
            {currentAddress.phone && (
              <Text style={styles.addressPhone}>Phone: {currentAddress.phone}</Text>
            )}
          </View>
        )}

        <View style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View>
              <Text style={styles.serviceName}>{cartItem.serviceName}</Text>
              <Text style={styles.serviceDetails}>{cartItem.vehicleType}</Text>
            </View>
            <Text style={styles.servicePrice}>{formatCurrency(cartItem.baseServicePrice)}</Text>
          </View>

          <View style={styles.serviceInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{cartItem.duration} mins</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="repeat" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{cartItem.frequency}</Text>
            </View>
          </View>
        </View>

        {cartItem.selectedAddOns.length > 0 && (
          <View style={styles.addOnsCard}>
            <Text style={styles.addOnsTitle}>Add-ons Selected</Text>
            {cartItem.selectedAddOns.map((addon, index) => (
              <View key={index} style={styles.addOnItem}>
                <Ionicons name="checkmark-circle" size={18} color="#1453b4" />
                <View style={styles.addOnContent}>
                  <Text style={styles.addOnName}>{addon.name}</Text>
                </View>
                <Text style={styles.addOnPrice}>{formatCurrency(addon.price)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.priceBreakdownCard}>
          <Text style={styles.breakdownTitle}>Price Breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>MRP Total</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(cartItem.baseServicePrice)}</Text>
          </View>

          {cartItem.selectedAddOns.length > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Add-ons Total</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(cartItem.addOnsTotal)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.finalLabel}>Final Amount</Text>
            <Text style={styles.finalValue}>{formatCurrency(cartItem.totalAmount)}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={handleMakePayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.paymentButtonText}>Make Payment</Text>
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
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  addressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  addressBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#1453b4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  addressFullText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  addressPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
  serviceCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  serviceDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1453b4',
  },
  serviceInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
  },
  addOnsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addOnsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  addOnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    paddingVertical: 8,
  },
  addOnContent: {
    flex: 1,
  },
  addOnName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  addOnPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1453b4',
  },
  priceBreakdownCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  finalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  finalValue: {
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
  paymentButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
});
