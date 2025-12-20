import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WHATSAPP_NUMBER = '+917337718170'; // CarzTuneUp WhatsApp business number
const WHATSAPP_MESSAGE = 'Hello CarzTuneUp, I want to apply for car insurance.';

export default function InsuranceScreen() {
  const openWhatsApp = async () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on your device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
      console.error('Error opening WhatsApp:', error);
    }
  };

  const features = [
    {
      icon: 'shield-checkmark',
      title: 'Comprehensive Coverage',
      description: 'Full protection for your vehicle against accidents and damages',
    },
    {
      icon: 'cash',
      title: 'Affordable Premiums',
      description: 'Competitive rates with flexible payment options',
    },
    {
      icon: 'time',
      title: '24/7 Support',
      description: 'Round-the-clock assistance whenever you need help',
    },
    {
      icon: 'document-text',
      title: 'Easy Claims',
      description: 'Quick and hassle-free claim processing',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={64} color="#1453b4" />
        <Text style={styles.title}>Car Insurance</Text>
        <Text style={styles.subtitle}>
          Protect your vehicle with comprehensive insurance coverage
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Our Insurance?</Text>
        
        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <Ionicons name={feature.icon} size={28} color="#1453b4" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaText}>
          Contact us on WhatsApp to get a personalized quote and learn more about our insurance plans
        </Text>
        
        <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
          <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
          <Text style={styles.whatsappButtonText}>Contact on WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Required Documents (Mandatory):</Text>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#DC3545" />
            <Text style={[styles.infoText, styles.mandatoryText]}>Registration Card (RC)</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#DC3545" />
            <Text style={[styles.infoText, styles.mandatoryText]}>Old Insurance Copy</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#DC3545" />
            <Text style={[styles.infoText, styles.mandatoryText]}>Vehicle Number</Text>
          </View>
        </View>
        <Text style={styles.infoNote}>
          After sharing these documents on WhatsApp, our team will contact you shortly with your insurance quote.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
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
  },
  iconContainer: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  ctaSection: {
    backgroundColor: '#1453b4',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  whatsappButton: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#212529',
  },
  mandatoryText: {
    fontWeight: '600',
    color: '#DC3545',
  },
  infoNote: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
