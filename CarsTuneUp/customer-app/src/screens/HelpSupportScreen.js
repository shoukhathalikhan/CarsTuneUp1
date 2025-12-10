import React, { useState } from 'react';
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

const WHATSAPP_NUMBER = '917337718170';

export default function HelpSupportScreen({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I book a car wash service?',
      answer:
        'To book a service:\n1. Go to Home screen\n2. Browse available services\n3. Select your preferred service\n4. Choose frequency (daily, weekly, etc.)\n5. Click "Subscribe Now"\n6. Confirm your booking',
    },
    {
      id: 2,
      question: 'How can I cancel my subscription?',
      answer:
        'To cancel your subscription:\n1. Go to "Subscriptions" tab\n2. Select the subscription you want to cancel\n3. Click on "View Details"\n4. Tap "Cancel Subscription"\n5. Confirm cancellation\n\nNote: You can cancel anytime without any penalty.',
    },
    {
      id: 3,
      question: 'What if the employee doesn\'t arrive on time?',
      answer:
        'If your assigned employee doesn\'t arrive:\n1. Wait for 15 minutes past scheduled time\n2. Contact us via WhatsApp or call support\n3. We\'ll immediately assign another employee\n4. You\'ll receive a notification with new employee details\n\nWe ensure 100% service completion.',
    },
    {
      id: 4,
      question: 'How do I change my service address?',
      answer:
        'To update your address:\n1. Go to "Profile" tab\n2. Tap on "Address" option\n3. Update your address details\n4. Save changes\n\nYour new address will be used for all future services.',
    },
    {
      id: 5,
      question: 'What payment methods are accepted?',
      answer:
        'Currently we accept:\n• Cash on Service (Available Now)\n\nComing Soon:\n• UPI (Google Pay, PhonePe, Paytm)\n• Credit/Debit Cards\n• Net Banking\n• Digital Wallets',
    },
    {
      id: 6,
      question: 'How do I report a service quality issue?',
      answer:
        'If you\'re not satisfied with the service:\n1. Contact us immediately via WhatsApp\n2. Describe the issue in detail\n3. Our team will review and respond within 2 hours\n4. We\'ll arrange a re-service if needed at no extra cost\n\nYour satisfaction is our priority!',
    },
    {
      id: 7,
      question: 'Can I change my car details?',
      answer:
        'Yes! To update your vehicle information:\n1. Go to "Profile" tab\n2. Tap on "Vehicle" option\n3. Select new brand and model\n4. Save changes\n\nUpdated details will be used for future services.',
    },
    {
      id: 8,
      question: 'What are the service timings?',
      answer:
        'Our service hours:\n• Monday to Saturday: 8:00 AM - 6:00 PM\n• Sunday: 9:00 AM - 4:00 PM\n\nYou can schedule services during these hours. We\'ll arrive at your preferred time slot.',
    },
    {
      id: 9,
      question: 'How do I track my subscription?',
      answer:
        'To track your subscription:\n1. Go to "Subscriptions" tab\n2. View all active subscriptions\n3. Tap on any subscription for details\n4. See next wash date, frequency, and history\n\nYou\'ll also receive notifications before each wash.',
    },
    {
      id: 10,
      question: 'Is there a minimum subscription period?',
      answer:
        'No minimum period required!\n• Subscribe for as long as you want\n• Cancel anytime without penalty\n• One-time wash also available\n• Flexible plans to suit your needs',
    },
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const openWhatsApp = async () => {
    const message = 'Hello! I need help with Car Shower app.';
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on your device');
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'Could not open WhatsApp');
    }
  };

  const callSupport = () => {
    const phoneNumber = `tel:${WHATSAPP_NUMBER}`;
    Linking.openURL(phoneNumber);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1453b4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Need Immediate Help?</Text>
          
          <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
            <View style={styles.contactIconCircle}>
              <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>WhatsApp Support</Text>
              <Text style={styles.contactSubtitle}>Chat with us instantly</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={callSupport}>
            <View style={styles.contactIconCircle}>
              <Ionicons name="call" size={28} color="#1453b4" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Call Support</Text>
              <Text style={styles.contactSubtitle}>+91 73377 18170</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFaq(faq.id)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#1453b4"
                />
              </TouchableOpacity>

              {expandedFaq === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Still Need Help */}
        <View style={styles.helpBanner}>
          <Ionicons name="help-circle-outline" size={48} color="#1453b4" />
          <Text style={styles.helpBannerTitle}>Still need help?</Text>
          <Text style={styles.helpBannerText}>
            Our support team is available to assist you
          </Text>
          <TouchableOpacity style={styles.helpButton} onPress={openWhatsApp}>
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  contactSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  contactCard: {
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
  contactIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  faqSection: {
    padding: 16,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
    marginRight: 12,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  helpBanner: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpBannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  helpBannerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  helpButton: {
    backgroundColor: '#1453b4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
