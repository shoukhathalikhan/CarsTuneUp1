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

  const summary = getCartSummary();

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

    navigation.navigate('OrderReview');
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
