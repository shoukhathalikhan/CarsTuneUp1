import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../config/api';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoType, setPhotoType] = useState(''); // 'before' or 'after'
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);

  useEffect(() => {
    fetchJobDetails();
    requestCameraPermission();
  }, [jobId]);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
    }
  };

  const validateCount = (count) => count >= 4 && count <= 5;

  const addAsset = (asset) => {
    setSelectedAssets((prev) => {
      if (prev.length >= 5) return prev;
      return [...prev, asset];
    });
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });

      if (!result.canceled && Array.isArray(result.assets)) {
        setSelectedAssets(result.assets.slice(0, 5));
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      Alert.alert('Error', 'Failed to select photos');
    }
  };

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      console.log('Job details response:', response.data);
      
      const jobData = response.data.data?.job || response.data.data;
      console.log('Job photos - Before:', jobData?.beforePhotos, 'After:', jobData?.afterPhotos);
      setJob(jobData);
      
      console.log('Job loaded:', jobData);
    } catch (error) {
      console.error('Error fetching job details:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (action) => {
    setUpdating(true);
    try {
      let endpoint;
      let successMessage;
      
      if (action === 'start') {
        endpoint = `/jobs/${jobId}/start`;
        successMessage = 'Job started successfully';
      } else if (action === 'complete') {
        endpoint = `/jobs/${jobId}/complete`;
        successMessage = 'Job completed successfully';
      }
      
      await api.put(endpoint);
      Alert.alert('Success', successMessage);
      // Add delay to ensure backend has processed the completion
      setTimeout(() => {
        fetchJobDetails(); // Refresh job details
      }, 500);
    } catch (error) {
      console.error('Error updating job status:', error);
      Alert.alert('Error', 'Failed to update job status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleNavigate = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
    )}`;
    Linking.openURL(url);
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addAsset(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadSelectedPhotosAndUpdateJob = async () => {
    if (!validateCount(selectedAssets.length)) {
      Alert.alert('Invalid Photo Count', 'Please select 4 to 5 photos.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      const isBefore = photoType === 'before';
      const fieldName = isBefore ? 'beforePhotos' : 'afterPhotos';

      selectedAssets.forEach((asset, index) => {
        formData.append(fieldName, {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: `${fieldName}-${Date.now()}-${index}.jpg`,
        });
      });

      const endpoint = isBefore ? `/jobs/${jobId}/start-with-photos` : `/jobs/${jobId}/complete`;
      const successMessage = isBefore ? 'Job started successfully' : 'Job completed successfully';

      await api.put(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowPhotoModal(false);
      setSelectedAssets([]);
      Alert.alert('Success', successMessage);
      setTimeout(() => {
        fetchJobDetails();
      }, 500);
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload photos');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleStartJob = () => {
    setPhotoType('before');
    setShowPhotoModal(true);
    setSelectedAssets([]);
  };

  const handleCompleteJob = () => {
    setPhotoType('after');
    setShowPhotoModal(true);
    setSelectedAssets([]);
  };

  const confirmJobAction = async () => {
    await uploadSelectedPhotosAndUpdateJob();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'in_progress':
        return '#1453b4';
      case 'completed':
        return '#28A745';
      case 'cancelled':
        return '#DC3545';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1453b4" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text>Job not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <Text style={styles.statusText}>{job.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{job.customerId?.name || 'N/A'}</Text>
          </View>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleCall(job.customerId?.phone)}
          >
            <Ionicons name="call-outline" size={20} color="#1453b4" />
            <Text style={[styles.infoText, styles.linkText]}>{job.customerId?.phone || 'N/A'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {job.serviceId?.name || 'Service'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color="#666" />
            <Text style={styles.infoText}>₹{job.serviceId?.price || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Invalid Date'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {job.scheduledDate ? new Date(job.scheduledDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity onPress={() => handleNavigate(job.customerId?.address)}>
              <Ionicons name="navigate-outline" size={24} color="#1453b4" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {job.customerId?.address?.street || job.location?.address || 'Address not available'}
            </Text>
          </View>
        </View>

        {job.services && job.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {job.services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>₹{service.price}</Text>
              </View>
            ))}
          </View>
        )}

        {job.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{job.notes}</Text>
          </View>
        )}

        {/* Photo Display Section */}
        {(job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Photos</Text>
            
            {job.beforePhotos?.length > 0 && (
              <View style={styles.photoSection}>
                <Text style={styles.photoLabel}>Before Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {job.beforePhotos.map((photo, index) => (
                    <View key={`before-${index}`} style={styles.photoContainer}>
                      <Image 
                        source={{ uri: photo }} 
                        style={styles.photo}
                        onError={(error) => console.log('Before photo load error:', error)}
                        onLoad={() => console.log('Before photo loaded successfully:', photo)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {job.afterPhotos?.length > 0 && (
              <View style={styles.photoSection}>
                <Text style={styles.photoLabel}>After Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {job.afterPhotos.map((photo, index) => (
                    <View key={`after-${index}`} style={styles.photoContainer}>
                      <Image 
                        source={{ uri: photo }} 
                        style={styles.photo}
                        onError={(error) => console.log('After photo load error:', error)}
                        onLoad={() => console.log('After photo loaded successfully:', photo)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {(job.status === 'scheduled' || job.status === 'pending') && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartJob}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="play-outline" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Start Job</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {(job.status === 'in-progress' || job.status === 'in_progress') && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteJob}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Complete Job</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Photo Capture Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Take {photoType === 'before' ? 'Before' : 'After'} Photo
              </Text>
              <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Please take a {photoType === 'before' ? 'before' : 'after'} photo of the vehicle
              </Text>
              
              <TouchableOpacity
                style={styles.photoButton}
                onPress={takePhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="camera" size={24} color="#fff" />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {job.beforePhotos?.length > 0 && photoType === 'after' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={confirmJobAction}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-outline" size={24} color="#fff" />
                      <Text style={styles.actionButtonText}>Complete Job</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {photoType === 'before' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.startButton]}
                  onPress={confirmJobAction}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="play-outline" size={24} color="#fff" />
                      <Text style={styles.actionButtonText}>Start Job</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1453b4',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  linkText: {
    color: '#1453b4',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceName: {
    fontSize: 14,
    color: '#333',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1453b4',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  startButton: {
    backgroundColor: '#1453b4',
  },
  completeButton: {
    backgroundColor: '#28A745',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  photoSection: {
    marginBottom: 15,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  photoContainer: {
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  photoButton: {
    backgroundColor: '#1453b4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
