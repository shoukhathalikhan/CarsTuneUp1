import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TermsPrivacyScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'

  const termsContent = [
    {
      title: '1. Acceptance of Terms',
      content:
        'By accessing and using the Car Shower mobile application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.',
    },
    {
      title: '2. Service Description',
      content:
        'Car Shower provides on-demand car washing services at your doorstep. We connect customers with professional car wash service providers. The quality and execution of services are subject to availability and location.',
    },
    {
      title: '3. User Responsibilities',
      content:
        '• Provide accurate information during registration\n• Ensure vehicle accessibility at scheduled time\n• Provide safe working environment for service providers\n• Make timely payments as per chosen plan\n• Report any issues within 24 hours of service completion',
    },
    {
      title: '4. Subscription and Payments',
      content:
        '• Subscriptions are billed according to chosen frequency\n• Payments must be made as per selected method\n• Subscription can be cancelled anytime\n• No refunds for partial month cancellations\n• One-time services are paid per wash',
    },
    {
      title: '5. Cancellation Policy',
      content:
        '• Cancel subscription anytime without penalty\n• Cancellation takes effect from next billing cycle\n• Individual service cancellation: 2 hours before scheduled time\n• Late cancellations may incur charges',
    },
    {
      title: '6. Service Quality',
      content:
        '• We strive to provide best quality service\n• Report quality issues within 24 hours\n• Re-service will be provided for valid complaints\n• Service standards are maintained as per industry norms',
    },
    {
      title: '7. Limitation of Liability',
      content:
        'Car Shower is not liable for:\n• Pre-existing vehicle damage\n• Damage due to vehicle defects\n• Items left inside the vehicle\n• Service delays due to weather or unforeseen circumstances',
    },
    {
      title: '8. Modifications to Service',
      content:
        'We reserve the right to modify or discontinue services with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of service.',
    },
  ];

  const privacyContent = [
    {
      title: '1. Information We Collect',
      content:
        'We collect the following information:\n• Name, email, phone number\n• Vehicle details (brand, model)\n• Service address and location\n• Payment information\n• Service history and preferences\n• Device information and app usage data',
    },
    {
      title: '2. How We Use Your Information',
      content:
        'Your information is used to:\n• Provide and improve our services\n• Process payments and subscriptions\n• Send service notifications and reminders\n• Communicate important updates\n• Analyze and improve user experience\n• Prevent fraud and ensure security',
    },
    {
      title: '3. Information Sharing',
      content:
        'We share your information with:\n• Service providers (only necessary details)\n• Payment processors (for transactions)\n• Analytics services (anonymized data)\n\nWe DO NOT:\n• Sell your personal information\n• Share data with third-party advertisers\n• Disclose information without consent',
    },
    {
      title: '4. Data Security',
      content:
        'We implement security measures to protect your data:\n• Encrypted data transmission\n• Secure servers and databases\n• Regular security audits\n• Access controls and authentication\n• Compliance with data protection laws',
    },
    {
      title: '5. Location Data',
      content:
        'We collect location data to:\n• Provide service at your address\n• Assign nearest service provider\n• Improve service efficiency\n\nYou can control location permissions in app settings. Denying location access may limit service functionality.',
    },
    {
      title: '6. Cookies and Tracking',
      content:
        'We use cookies and similar technologies to:\n• Remember your preferences\n• Analyze app usage patterns\n• Improve user experience\n• Provide personalized content\n\nYou can manage cookie preferences in your device settings.',
    },
    {
      title: '7. Your Rights',
      content:
        'You have the right to:\n• Access your personal data\n• Correct inaccurate information\n• Request data deletion\n• Opt-out of marketing communications\n• Export your data\n• Withdraw consent anytime',
    },
    {
      title: '8. Children\'s Privacy',
      content:
        'Our service is not intended for children under 18. We do not knowingly collect information from children. If you believe we have collected data from a child, please contact us immediately.',
    },
    {
      title: '9. Changes to Privacy Policy',
      content:
        'We may update this privacy policy periodically. We will notify you of significant changes via:\n• In-app notifications\n• Email notifications\n• App update notes\n\nContinued use after changes constitutes acceptance.',
    },
    {
      title: '10. Contact Us',
      content:
        'For privacy-related questions or concerns:\n\nEmail: privacy@carshower.com\nPhone: +91 73377 18170\nAddress: [Company Address]\n\nWe will respond to all requests within 30 days.',
    },
  ];

  const renderContent = () => {
    const content = activeTab === 'terms' ? termsContent : privacyContent;

    return content.map((section, index) => (
      <View key={index} style={styles.section}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionContent}>{section.content}</Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1453b4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={activeTab === 'terms' ? '#1453b4' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'terms' && styles.activeTabText,
            ]}
          >
            Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={activeTab === 'privacy' ? '#1453b4' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'privacy' && styles.activeTabText,
            ]}
          >
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last Updated: November 10, 2025
          </Text>
        </View>

        {renderContent()}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={24} color="#666" />
          <Text style={styles.footerText}>
            By using Car Shower, you agree to these terms and policies
          </Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#E7F3FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#1453b4',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  lastUpdated: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  lastUpdatedText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F3FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: '#1453b4',
    marginLeft: 12,
    lineHeight: 20,
  },
});
