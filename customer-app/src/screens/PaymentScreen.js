import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import api from '../config/api';
import { sendLocalNotification } from '../services/notificationService';
import { wp, hp, rfs, getStatusBarHeight, getBottomSpace, spacing } from '../utils/responsive';

const formatCurrency = (amount) => {
  const numeric = Number(amount || 0);
  return `₹${numeric.toLocaleString('en-IN', {
    minimumFractionDigits: numeric % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
};

const PAYMENT_METHODS = [
  {
    id: 'upi',
    title: 'UPI',
    options: ['Paytm', 'PhonePe', 'Amazon Pay', 'UPI ID'],
    icon: 'phone-portrait'
  },
  {
    id: 'netbanking',
    title: 'Net Banking',
    banks: ['Axis', 'HDFC', 'ICICI', 'SBI', 'Kotak', 'PNB'],
    icon: 'business'
  },
  {
    id: 'card',
    title: 'Credit/Debit/ATM Card',
    icon: 'card'
  },
  {
    id: 'wallet',
    title: 'Wallets',
    icon: 'wallet'
  }
];

export default function PaymentScreen({ navigation, route }) {
  const { orderData } = route.params || {};
  const { cartItems, clearCart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedAmount, setExpandedAmount] = useState(false);

  const cartItem = cartItems[0] || orderData;
  const totalAmount = cartItem?.totalAmount || 0;
  const serviceName = cartItem?.serviceName || cartItem?.name || 'service';

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handleProcessPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue.');
      return;
    }

    if (!cartItem || !cartItem.serviceId) {
      Alert.alert('Error', 'Service information is missing. Please try again.');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate payment ID
      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create subscription after successful payment
      const response = await api.post('/subscriptions', {
        serviceId: cartItem.serviceId,
        paymentId: paymentId
      });

      // Clear cart after successful subscription creation
      clearCart();

      // Send immediate notification
      await sendLocalNotification(
        '🎉 Service Booked Successfully!',
        `Your ${serviceName} subscription has been created. We will send you the scheduled service dates very soon.`,
        {
          type: 'booking_confirmed',
          serviceName: serviceName,
          subscriptionId: response.data?.data?._id,
        }
      );

      Alert.alert(
        '🎉 Service Booked Successfully!',
        `Thank you for booking with CarzTuneUp!\n\n✅ Your ${serviceName} subscription has been created.\n\n📅 We will send you the scheduled service dates very soon.\n\n👨‍🔧 Our admin team is reviewing your booking and will assign a professional employee to you shortly.\n\nYou'll receive a notification once everything is confirmed!`,
        [
          {
            text: 'View My Subscriptions',
            onPress: () => {
              navigation.navigate('MainTabs', { screen: 'Subscriptions' });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Payment/Subscription error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create subscription. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.amountCard}
          onPress={() => setExpandedAmount(!expandedAmount)}
          activeOpacity={0.8}
        >
          <View style={styles.amountContent}>
            <Ionicons name="wallet" size={28} color="#EF4444" />
            <View style={styles.amountText}>
              <Text style={styles.amountLabel}>Amount Payable</Text>
              <Text style={styles.amountValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
          <Ionicons
            name={expandedAmount ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#1453b4"
          />
        </TouchableOpacity>

        {expandedAmount && cartItem && (
          <View style={styles.amountBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Service Price</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(cartItem.baseServicePrice)}</Text>
            </View>
            {cartItem.selectedAddOns && cartItem.selectedAddOns.length > 0 && (
              <>
                <Text style={styles.addOnsLabel}>Add-ons</Text>
                {cartItem.selectedAddOns.map((addon, index) => (
                  <View key={index} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{addon.name}</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(addon.price)}</Text>
                  </View>
                ))}
              </>
            )}
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        )}

        <View style={styles.paymentMethodsContainer}>
          {PAYMENT_METHODS.map((method) => (
            <View key={method.id} style={styles.methodSection}>
              <TouchableOpacity
                style={[
                  styles.methodHeader,
                  selectedMethod === method.id && styles.methodHeaderSelected
                ]}
                onPress={() => handlePaymentMethodSelect(method.id)}
              >
                <View style={styles.methodTitleRow}>
                  <Ionicons
                    name={method.icon}
                    size={20}
                    color={selectedMethod === method.id ? '#1453b4' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.methodTitle,
                      selectedMethod === method.id && styles.methodTitleSelected
                    ]}
                  >
                    {method.title}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedMethod === method.id && styles.radioButtonSelected
                  ]}
                >
                  {selectedMethod === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>

              {selectedMethod === method.id && method.banks && (
                <View style={styles.bankGrid}>
                  {method.banks.map((bank, index) => (
                    <TouchableOpacity key={index} style={styles.bankOption}>
                      <Text style={styles.bankName}>{bank}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.bankOption}>
                    <Text style={styles.moreBanksText}>More banks</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedMethod === method.id && method.options && (
                <View style={styles.optionsContainer}>
                  {method.options.map((option, index) => (
                    <TouchableOpacity key={index} style={styles.optionItem}>
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, !selectedMethod && styles.payButtonDisabled]}
          onPress={handleProcessPayment}
          disabled={isProcessing || !selectedMethod}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay {formatCurrency(totalAmount)}</Text>
          )}
        </TouchableOpacity>
      </View>
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
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  amountText: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  amountBreakdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  addOnsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1453b4',
  },
  paymentMethodsContainer: {
    gap: 16,
  },
  methodSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  methodHeaderSelected: {
    backgroundColor: '#F0F9FF',
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  methodTitleSelected: {
    color: '#1453b4',
    fontWeight: '700',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1453b4',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1453b4',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
    backgroundColor: '#F9FAFB',
  },
  bankOption: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bankName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  moreBanksText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1453b4',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
    backgroundColor: '#F9FAFB',
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + getBottomSpace(),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
