import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { useApp } from '../context/AppContext';

export default function ServicesScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentVehicle } = useApp();

  // Helper function to format frequency display
  const formatFrequency = (freq) => {
    const displayNames = {
      'daily': 'Daily',
      '2-days-once': '2 Days Once',
      '3-days-once': '3 Days Once',
      'weekly-once': 'Weekly Once',
      'one-time': 'One Time'
    };
    return displayNames[freq] || freq;
  };

  useEffect(() => {
    fetchServices();
  }, [currentVehicle]);

  const fetchServices = async () => {
    try {
      const params = {};
      
      // Add vehicle information for percentage-based pricing
      if (currentVehicle && currentVehicle.brand && currentVehicle.model) {
        params.userBrand = currentVehicle.brand;
        params.userModel = currentVehicle.model;
      }
      
      const response = await api.get('/services', { params });
      setServices(response.data.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1453b4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1453b4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Services</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.subtitle}>Choose the perfect plan for your car</Text>

          <TouchableOpacity
            style={[styles.serviceCard, { alignItems: 'center', padding: 24 }]}
            onPress={() => navigation.navigate('CarWashPlans')}
          >
            <Ionicons name="car" size={36} color="#1453b4" />
            <Text style={[styles.serviceName, { marginTop: 12 }]}>View Car Shower Plans</Text>
            <Text style={[styles.serviceDescription, { textAlign: 'center' }]}>See Hatchback/Sedan and SUV/MUV packages</Text>
          </TouchableOpacity>

          {services.map((service) => (
            <TouchableOpacity
              key={service._id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate('ServiceDetail', { service })}
            >
              {service.imageURL && (
                <Image
                  source={{ uri: service.imageURL }}
                  style={styles.serviceImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.serviceContent}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                  <View style={styles.serviceDetails}>
                    <View style={styles.priceTag}>
                      <Text style={styles.price}>₹{service.price}/month</Text>
                    </View>
                    <View style={styles.frequencyTag}>
                      <Ionicons name="calendar-outline" size={14} color="#1453b4" />
                      <Text style={styles.frequency}>{formatFrequency(service.frequency)}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#1453b4" />
              </View>
            </TouchableOpacity>
          ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 20,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 180,
  },
  serviceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  priceTag: {
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1453b4',
  },
  frequencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  frequency: {
    fontSize: 12,
    color: '#1453b4',
    textTransform: 'capitalize',
  },
});
