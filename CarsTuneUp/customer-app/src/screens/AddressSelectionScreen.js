import React, { useState, useEffect, useRef } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import api from '../config/api';
import { useApp } from '../context/AppContext';

export default function AddressSelectionScreen({ navigation, route }) {
  const { fromProfile = false, fromHome = false, fromBooking = false, fromCart = false, fromOrderReview = false, addAddressOnly = false } = route.params || {};
  const { addOrUpdateAddress } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: '',
    coordinates: null,
  });
  const initialRegion = {
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };
  const [mapRegion, setMapRegion] = useState(initialRegion);
  const [currentCoords, setCurrentCoords] = useState(null);
  const mapRef = useRef(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  useEffect(() => {
    (async () => {
      await requestLocationPermission();
      const cachedLocation = await Location.getLastKnownPositionAsync();
      if (cachedLocation) {
        const coords = {
          latitude: cachedLocation.coords.latitude,
          longitude: cachedLocation.coords.longitude,
        };
        await applyLocationSelection(coords);
      } else {
        const fallbackCoords = {
          latitude: initialRegion.latitude,
          longitude: initialRegion.longitude,
        };
        focusMapOn(fallbackCoords);
        setCurrentCoords(fallbackCoords);
        setAddress((prev) => ({
          ...prev,
          coordinates: fallbackCoords,
        }));
      }
    })();
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

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      await applyLocationSelection(coords);
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
              } else if (fromBooking) {
                navigateBackToBooking();
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

  const navigateBackToBooking = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('SubscriptionBooking');
    }
  };

  const focusMapOn = (coords) => {
    const nextRegion = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
    setMapRegion(nextRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(nextRegion, 320);
    }
  };

  const resolveAddressFromCoords = async (coords) => {
    setResolvingAddress(true);
    try {
      const [addressData] = await Location.reverseGeocodeAsync(coords);
      setAddress((prev) => ({
        ...prev,
        street: `${addressData?.name || ''} ${addressData?.street || ''}`.trim() || prev.street,
        city: addressData?.city || prev.city,
        state: addressData?.region || prev.state,
        zipCode: addressData?.postalCode || prev.zipCode,
        landmark: addressData?.district || prev.landmark,
        coordinates: coords,
      }));
    } catch (error) {
      console.error('Reverse geocode failed:', error);
      setAddress((prev) => ({
        ...prev,
        coordinates: coords,
      }));
    } finally {
      setResolvingAddress(false);
    }
  };

  const applyLocationSelection = async (coords) => {
    setCurrentCoords(coords);
    focusMapOn(coords);
    await resolveAddressFromCoords(coords);
  };

  const handleMapPress = async (event) => {
    const coords = event.nativeEvent.coordinate;
    await applyLocationSelection(coords);
  };

  const handleMarkerDragEnd = async (event) => {
    const coords = event.nativeEvent.coordinate;
    await applyLocationSelection(coords);
  };

  const primaryAddressLine = address.street?.trim() || 'Drop a pin to set your service location';
  const secondaryAddressLine = [address.landmark, address.city, address.state, address.zipCode]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {(fromProfile || fromBooking || fromCart || fromOrderReview) ? (
          <TouchableOpacity
            onPress={() => {
              if (fromProfile) {
                navigation.navigate('MainTabs', { screen: 'Profile' });
              } else if (fromBooking) {
                navigateBackToBooking();
              } else {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#1453b4" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Add Address</Text>
        {(!fromProfile && !fromBooking && !fromCart && !fromOrderReview) ? (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!addAddressOnly && (
        <View style={styles.mapCard}>
          <View style={styles.mapHeaderRow}>
            <Text style={styles.mapHeaderTitle}>Selected Location</Text>
            <TouchableOpacity
              style={[styles.mapDetectButton, locationLoading && styles.mapDetectButtonDisabled]}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#1453b4" />
              ) : (
                <View style={styles.mapDetectContent}>
                  <Ionicons name="navigate" size={18} color="#1453b4" style={{ marginRight: 6 }} />
                  <Text style={styles.mapDetectText}>Use Current</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              mapType="standard"
              initialRegion={initialRegion}
              region={mapRegion}
              onPress={handleMapPress}
              showsUserLocation
              loadingEnabled
            >
              {currentCoords && (
                <Marker
                  coordinate={currentCoords}
                  draggable
                  pinColor="#ff4d4f"
                  onDragEnd={handleMarkerDragEnd}
                />
              )}
            </MapView>
            {resolvingAddress && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.mapLoadingText}>Updating address...</Text>
              </View>
            )}
          </View>

          <View style={styles.mapAddressRow}>
            <View style={styles.mapAddressTextBlock}>
              <Text style={styles.mapAddressPrimary}>{primaryAddressLine}</Text>
              {secondaryAddressLine ? (
                <Text style={styles.mapAddressSecondary}>{secondaryAddressLine}</Text>
              ) : null}
            </View>
          </View>
          <Text style={styles.mapHint}>Tap the map or drag the pin to fine-tune your service address.</Text>
        </View>
        )}

        <View style={styles.spacer24} />
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
  contentContainer: {
    paddingBottom: 32,
  },
  spacer24: {
    height: 24,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  mapHeaderRow: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0b1f4b',
  },
  mapDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(20,83,180,0.12)',
  },
  mapDetectButtonDisabled: {
    opacity: 0.6,
  },
  mapDetectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapDetectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1453b4',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mapContainer: {
    height: 220,
    width: '100%',
    borderRadius: 0,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,31,75,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mapAddressRow: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,31,75,0.08)',
  },
  mapAddressTextBlock: {
    marginTop: 0,
  },
  mapAddressPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b1f4b',
  },
  mapAddressSecondary: {
    fontSize: 13,
    color: '#51617c',
    lineHeight: 18,
  },
  mapHint: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    fontSize: 12,
    color: '#71829c',
    letterSpacing: 0.2,
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
