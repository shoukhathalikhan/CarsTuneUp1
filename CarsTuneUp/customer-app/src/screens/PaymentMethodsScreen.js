import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodsScreen({ navigation }) {
  const [selectedMethod, setSelectedMethod] = useState('cash');

  const paymentMethods = [
    {
      id: 'cash',
      name: 'Cash on Service',
      icon: 'cash-outline',
      description: 'Pay cash when service is completed',
      available: true,
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: 'phone-portrait-outline',
      description: 'Google Pay, PhonePe, Paytm, etc.',
      available: false,
      comingSoon: true,
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'card-outline',
      description: 'Visa, Mastercard, Rupay',
      available: false,
      comingSoon: true,
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: 'business-outline',
      description: 'Pay via your bank account',
      available: false,
      comingSoon: true,
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: 'wallet-outline',
      description: 'Paytm, PhonePe, Amazon Pay',
      available: false,
      comingSoon: true,
    },
  ];

  const handleSelectMethod = (methodId, available) => {
    if (!available) {
      Alert.alert(
        'Coming Soon',
        'This payment method will be available soon. Currently, only Cash on Service is accepted.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedMethod(methodId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1453b4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color="#1453b4" />
          <Text style={styles.infoText}>
            Select your preferred payment method. More options coming soon!
          </Text>
        </View>

        {/* Payment Methods List */}
        <View style={styles.methodsContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.selectedCard,
                !method.available && styles.disabledCard,
              ]}
              onPress={() => handleSelectMethod(method.id, method.available)}
            >
              <View style={styles.methodLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    selectedMethod === method.id && styles.selectedIconCircle,
                    !method.available && styles.disabledIconCircle,
                  ]}
                >
                  <Ionicons
                    name={method.icon}
                    size={28}
                    color={
                      !method.available
                        ? '#ccc'
                        : selectedMethod === method.id
                        ? '#1453b4'
                        : '#666'
                    }
                  />
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodNameRow}>
                    <Text
                      style={[
                        styles.methodName,
                        !method.available && styles.disabledText,
                      ]}
                    >
                      {method.name}
                    </Text>
                    {method.comingSoon && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Coming Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.methodDescription,
                      !method.available && styles.disabledText,
                    ]}
                  >
                    {method.description}
                  </Text>
                </View>
              </View>

              {method.available && (
                <View
                  style={[
                    styles.radioButton,
                    selectedMethod === method.id && styles.radioButtonSelected,
                  ]}
                >
                  {selectedMethod === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Gateway Info */}
        <View style={styles.gatewayInfo}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#28A745" />
          <Text style={styles.gatewayTitle}>Secure Payment Gateway</Text>
          <Text style={styles.gatewayText}>
            We're integrating with leading payment gateways to provide you with
            secure and convenient payment options.
          </Text>
          <Text style={styles.gatewaySubtext}>
            Features coming soon:
          </Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28A745" />
              <Text style={styles.featureText}>UPI Payments</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28A745" />
              <Text style={styles.featureText}>Card Payments</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28A745" />
              <Text style={styles.featureText}>Net Banking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28A745" />
              <Text style={styles.featureText}>Digital Wallets</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F3FF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1453b4',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1453b4',
    lineHeight: 20,
  },
  methodsContainer: {
    padding: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#1453b4',
    backgroundColor: '#F0F8FF',
  },
  disabledCard: {
    opacity: 0.6,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedIconCircle: {
    backgroundColor: '#E7F3FF',
  },
  disabledIconCircle: {
    backgroundColor: '#F0F0F0',
  },
  methodInfo: {
    flex: 1,
  },
  methodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  comingSoonBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  methodDescription: {
    fontSize: 13,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1453b4',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1453b4',
  },
  gatewayInfo: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gatewayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 12,
    marginBottom: 8,
  },
  gatewayText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  gatewaySubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  featuresList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
});
