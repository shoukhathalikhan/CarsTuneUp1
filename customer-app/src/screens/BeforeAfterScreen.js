import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 32;
const IMAGE_HEIGHT = 180;

export default function BeforeAfterScreen({ navigation, route }) {
  const { job } = route.params || {};
  const [activeTab, setActiveTab] = useState('before');

  const beforePhotos = job?.beforePhotos || [];
  const afterPhotos = job?.afterPhotos || [];

  const currentPhotos = activeTab === 'before' ? beforePhotos : afterPhotos;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{job?.serviceId?.name || 'Car Wash'}</Text>
          <Text style={styles.headerSubtitle}>
            {job?.completedDate
              ? new Date(job.completedDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent Work'}
          </Text>
        </View>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'before' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('before')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'before' && styles.tabButtonTextActive,
            ]}
          >
            BEFORE
          </Text>
          <Text style={[
            styles.tabCount,
            activeTab === 'before' && styles.tabCountActive,
          ]}>
            {beforePhotos.length} photos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'after' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('after')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'after' && styles.tabButtonTextActive,
            ]}
          >
            AFTER
          </Text>
          <Text style={[
            styles.tabCount,
            activeTab === 'after' && styles.tabCountActive,
          ]}>
            {afterPhotos.length} photos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photos Grid */}
      <ScrollView
        style={styles.photosContainer}
        contentContainerStyle={styles.photosContent}
        showsVerticalScrollIndicator={false}
      >
        {currentPhotos.length > 0 ? (
          <View style={styles.photosList}>
            {currentPhotos.map((photo, index) => (
              <View key={`${activeTab}-${index}`} style={styles.photoWrapper}>
                <Image
                  source={{ uri: photo }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoIndex}>{index + 1}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'before' ? 'camera-outline' : 'checkmark-circle-outline'}
              size={64}
              color="#CBD5E1"
            />
            <Text style={styles.emptyText}>
              No {activeTab} photos available
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Employee Info */}
      {job?.employeeId?.userId?.name && (
        <View style={styles.employeeInfo}>
          <Ionicons name="person-circle-outline" size={20} color="#6C757D" />
          <Text style={styles.employeeText}>
            Service by {job.employeeId.userId.name}
          </Text>
        </View>
      )}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#E7F3FF',
    borderColor: '#1453b4',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C757D',
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: '#1453b4',
  },
  tabCount: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabCountActive: {
    color: '#1453b4',
  },
  photosContainer: {
    flex: 1,
  },
  photosContent: {
    padding: 16,
  },
  photosList: {
    gap: 16,
  },
  photoWrapper: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoIndex: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: 8,
  },
  employeeText: {
    fontSize: 14,
    color: '#6C757D',
  },
});
