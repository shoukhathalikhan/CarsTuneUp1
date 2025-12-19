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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import api from '../config/api';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { wp, hp, rfs, getStatusBarHeight, getBottomSpace, spacing } from '../utils/responsive';

export default function LocationAdditionScreen({ navigation, route }) {
  const { fromCart = false, fromOrderReview = false } = route.params || {};
  const { addOrUpdateAddress, selectAddress } = useApp();
  
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
          'Location permission is required. You can still add address manually.',
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
            { text: 'Grant Permission', onPress: () => requestLocationPermission() }
          ]
        );
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      await applyLocationSelection(coords);
    } catch (error) {
      Alert.alert('Error', 'Unable to get current location. Please try again.');
    } finally {
      setLocationLoading(false);
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

  const handleAddAddress = async () => {
    if (!address.street.trim() || !address.city.trim() || !address.state.trim() || !address.zipCode.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        landmark: address.landmark,
        coordinates: address.coordinates,
        label: 'Home',
      };

      const response = await api.post('/users/addresses', payload);
      if (response.data?.data?.address) {
        const newAddress = response.data.data.address;
        await selectAddress(newAddress.id);
        
        if (fromCart) {
          navigation.navigate('Cart');
        } else if (fromOrderReview) {
          navigation.navigate('OrderReview');
        } else {
          navigation.goBack();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add address. Please try again.');
      console.error('Error adding address:', error);
    } finally {
      setLoading(false);
    }
  };

  const primaryAddressLine = address.street?.trim() || 'Drop a pin to set your service location';
  const secondaryAddressLine = [address.landmark, address.city, address.state, address.zipCode]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1453b4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Location</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
          <Text style={styles.mapHint}>Tap the map or drag the pin to fine-tune your location.</Text>
        </View>

        <View style={styles.spacer24} />
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
          />
        </View>

        <View style={styles.spacer24} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddAddress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add Location</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: (StatusBar.currentHeight || 0) + spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mapHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  mapDetectButton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
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
  },
  mapContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  mapAddressRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  mapAddressTextBlock: {
    flex: 1,
  },
  mapAddressPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  mapAddressSecondary: {
    fontSize: 12,
    color: '#6B7280',
  },
  mapHint: {
    fontSize: 12,
    color: '#9CA3AF',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  spacer24: {
    height: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + getBottomSpace(),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
