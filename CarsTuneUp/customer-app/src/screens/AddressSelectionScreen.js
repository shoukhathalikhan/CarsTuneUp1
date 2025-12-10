import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { useApp } from '../context/AppContext';

export default function AddressSelectionScreen({ navigation, route }) {
  const { fromProfile = false, fromHome = false } = route.params || {};
  const { addOrUpdateAddress } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: '',
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission is required to provide better service. You can still add address manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant location permission to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Grant Permission',
              onPress: () => requestLocationPermission()
            }
          ]
        );
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const [addressData] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressData) {
        setAddress({
          street: `${addressData.name || ''} ${addressData.street || ''}`.trim(),
          city: addressData.city || '',
          state: addressData.region || '',
          zipCode: addressData.postalCode || '',
          landmark: addressData.district || '',
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please enter manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Use the new addresses API endpoint
      const response = await api.post('/users/addresses', address);
      console.log('Address save response:', response.data);

      const savedAddress = response.data.data.address;
      
      // Update AppContext with the new address
      await addOrUpdateAddress(savedAddress, true);

      Alert.alert(
        'Success',
        'Address saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (fromProfile) {
                navigation.navigate('MainTabs', { screen: 'Profile' });
              } else if (fromHome) {
                navigation.goBack();
              } else {
                navigation.navigate('VehicleSelection');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Save address error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save address. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (fromProfile) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
      return;
    }

    Alert.alert(
      'Skip Address',
      'You can add your address later from the profile section.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.navigate('VehicleSelection')
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {fromProfile ? (
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}>
            <Ionicons name="arrow-back" size={24} color="#1453b4" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Add Address</Text>
        {!fromProfile && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        {fromProfile && <View style={{ width: 24 }} />}
      </View>

      <ScrollView style={styles.content}>
        {/* Location Button */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color="#1453b4" />
          ) : (
            <Ionicons name="location" size={24} color="#1453b4" />
          )}
          <Text style={styles.locationButtonText}>
            {locationLoading ? 'Getting Location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.orText}>OR</Text>

        {/* Manual Address Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Street Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter street address"
            value={address.street}
            onChangeText={(text) => setAddress({ ...address, street: text })}
            multiline
            numberOfLines={2}
          />

          <Text style={styles.label}>Landmark</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter nearby landmark"
            value={address.landmark}
            onChangeText={(text) => setAddress({ ...address, landmark: text })}
          />

          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter city"
            value={address.city}
            onChangeText={(text) => setAddress({ ...address, city: text })}
          />

          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter state"
            value={address.state}
            onChangeText={(text) => setAddress({ ...address, state: text })}
          />

          <Text style={styles.label}>PIN Code *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter PIN code"
            value={address.zipCode}
            onChangeText={(text) => setAddress({ ...address, zipCode: text })}
            keyboardType="numeric"
            maxLength={6}
          />

          <Text style={styles.noteText}>* Required fields</Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </View>
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
  skipText: {
    fontSize: 16,
    color: '#1453b4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F3FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#1453b4',
    borderStyle: 'dashed',
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1453b4',
    marginLeft: 10,
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#1453b4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
