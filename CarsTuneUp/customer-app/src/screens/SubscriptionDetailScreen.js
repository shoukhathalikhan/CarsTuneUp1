import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';

function SubscriptionDetailScreen({ route, navigation }) {
  const { subscriptionId } = route.params;
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchSubscriptionDetails();
    fetchJobHistory();
  }, [subscriptionId]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}`);
      setSubscription(response.data.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      Alert.alert('Error', 'Unable to load subscription details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchJobHistory = async () => {
    try {
      const response = await api.get('/jobs/my-history');
      const subscriptionJobs = response.data.data.jobs.filter(job => 
        job.subscriptionId === subscriptionId
      );
      setJobs(subscriptionJobs);
    } catch (error) {
      console.error('Error fetching job history:', error);
    }
  };

  const openPhotoModal = (job) => {
    setSelectedJob(job);
    setShowPhotoModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#28a745';
      case 'paused':
        return '#ffc107';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1453b4" />
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Subscription not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Details</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.serviceName}>
              {subscription.serviceId?.name || 'Service'}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(subscription.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {subscription.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={24} color="#1453b4" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Service</Text>
                <Text style={styles.infoValue}>{subscription.serviceId?.name || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="repeat-outline" size={24} color="#1453b4" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Frequency</Text>
                <Text style={styles.infoValue}>{subscription.serviceId?.frequency || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={24} color="#1453b4" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Amount</Text>
                <Text style={styles.infoValue}>₹{subscription.amount || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={24} color="#28a745" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Start Date</Text>
                <Text style={styles.infoValue}>{formatDate(subscription.startDate)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={24} color="#dc3545" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>End Date</Text>
                <Text style={styles.infoValue}>{formatDate(subscription.endDate)}</Text>
              </View>
            </View>

            {subscription.nextWashDate && (
              <View style={styles.infoRow}>
                <Ionicons name="water" size={24} color="#1453b4" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Next Wash</Text>
                  <Text style={[styles.infoValue, { color: '#1453b4', fontWeight: '600' }]}>
                    {formatDate(subscription.nextWashDate)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Employee Information */}
        {subscription.assignedEmployee && subscription.assignedEmployee.userId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Employee</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person-circle-outline" size={24} color="#28a745" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Employee Name</Text>
                  <Text style={styles.infoValue}>{subscription.assignedEmployee.userId.name}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="id-card-outline" size={24} color="#28a745" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Employee ID</Text>
                  <Text style={styles.infoValue}>{subscription.assignedEmployee.employeeId}</Text>
                </View>
              </View>

              {subscription.assignedEmployee.userId.email && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={24} color="#28a745" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{subscription.assignedEmployee.userId.email}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={24} color="#ffc107" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Status</Text>
                <Text style={[
                  styles.infoValue,
                  { 
                    color: subscription.paymentStatus === 'completed' ? '#28a745' : '#dc3545',
                    fontWeight: '600'
                  }
                ]}>
                  {subscription.paymentStatus?.toUpperCase() || 'PENDING'}
                </Text>
              </View>
            </View>

            {subscription.paymentId && (
              <View style={styles.infoRow}>
                <Ionicons name="receipt-outline" size={24} color="#ffc107" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Payment ID</Text>
                  <Text style={styles.infoValue}>{subscription.paymentId}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Job History with Photos */}
        {jobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service History</Text>
            
            {jobs.map((job, index) => (
              <View key={job._id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View>
                    <Text style={styles.jobDate}>
                      {formatDate(job.scheduledDate)}
                    </Text>
                    <Text style={styles.jobService}>
                      {job.serviceId?.name || 'Service'}
                    </Text>
                  </View>
                  <View style={[styles.jobStatusBadge, { 
                    backgroundColor: job.status === 'completed' ? '#28a745' : '#ffc107' 
                  }]}>
                    <Text style={styles.jobStatusText}>
                      {job.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                {(job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
                  <TouchableOpacity 
                    style={styles.photoPreviewContainer}
                    onPress={() => openPhotoModal(job)}
                  >
                    <View style={styles.photoPreviewRow}>
                      {job.beforePhotos?.length > 0 && (
                        <View style={styles.photoPreviewItem}>
                          <Image 
                            source={{ uri: `http://192.168.1.125:5000${job.beforePhotos[0]}` }} 
                            style={styles.photoPreview} 
                          />
                          <Text style={styles.photoPreviewLabel}>Before</Text>
                        </View>
                      )}
                      {job.afterPhotos?.length > 0 && (
                        <View style={styles.photoPreviewItem}>
                          <Image 
                            source={{ uri: `http://192.168.1.125:5000${job.afterPhotos[0]}` }} 
                            style={styles.photoPreview} 
                          />
                          <Text style={styles.photoPreviewLabel}>After</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.viewPhotosButton}>
                      <Ionicons name="eye-outline" size={16} color="#1453b4" />
                      <Text style={styles.viewPhotosText}>View Details</Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                {job.employeeId?.userId && (
                  <View style={styles.employeeInfo}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.employeeName}>
                      {job.employeeId.userId.name}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Photo Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Service Photos</Text>
              <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedJob && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalDate}>
                  {formatDate(selectedJob.scheduledDate)}
                </Text>
                
                {selectedJob.beforePhotos?.length > 0 && (
                  <View style={styles.photoSection}>
                    <Text style={styles.photoSectionTitle}>Before Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {selectedJob.beforePhotos.map((photo, index) => (
                        <Image 
                          key={`before-${index}`} 
                          source={{ uri: `http://192.168.1.125:5000${photo}` }} 
                          style={styles.modalPhoto} 
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                {selectedJob.afterPhotos?.length > 0 && (
                  <View style={styles.photoSection}>
                    <Text style={styles.photoSectionTitle}>After Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {selectedJob.afterPhotos.map((photo, index) => (
                        <Image 
                          key={`after-${index}`} 
                          source={{ uri: `http://192.168.1.125:5000${photo}` }} 
                          style={styles.modalPhoto} 
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                {selectedJob.employeeId?.userId && (
                  <View style={styles.modalEmployeeInfo}>
                    <Ionicons name="person-outline" size={20} color="#1453b4" />
                    <Text style={styles.modalEmployeeName}>
                      Service by: {selectedJob.employeeId.userId.name}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
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
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  jobService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  jobStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jobStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  photoPreviewContainer: {
    marginTop: 8,
  },
  photoPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  photoPreviewItem: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  photoPreviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  viewPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  viewPhotosText: {
    fontSize: 14,
    color: '#1453b4',
    marginLeft: 4,
    fontWeight: '500',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  employeeName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
    width: '95%',
    maxHeight: '80%',
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
  modalDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  photoSection: {
    marginBottom: 20,
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalPhoto: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  modalEmployeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 10,
  },
  modalEmployeeName: {
    fontSize: 14,
    color: '#1453b4',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default SubscriptionDetailScreen;
