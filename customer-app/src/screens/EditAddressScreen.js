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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import api from '../config/api';
import { useApp } from '../context/AppContext';

export default function EditAddressScreen({ navigation, route }) {
  const { address: existingAddress } = route.params || {};
  const { addOrUpdateAddress } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showDeliverToModal, setShowDeliverToModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [address, setAddress] = useState({
    id: existingAddress?.id || null,
    street: existingAddress?.street || '',
    city: existingAddress?.city || '',
    state: existingAddress?.state || '',
    zipCode: existingAddress?.zipCode || '',
    landmark: existingAddress?.landmark || '',
    label: existingAddress?.label || '',
    phone: existingAddress?.phone || '',
    name: existingAddress?.name || '',
    coordinates: existingAddress?.coordinates || null,
  });

  const initialRegion = {
    latitude: existingAddress?.coordinates?.latitude || 12.9716,
    longitude: existingAddress?.coordinates?.longitude || 77.5946,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };
  const [mapRegion, setMapRegion] = useState(initialRegion);
  const [currentCoords, setCurrentCoords] = useState(
    existingAddress?.coordinates || null
  );
  const mapRef = useRef(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [addressType, setAddressType] = useState(existingAddress?.label || 'Home');

  useEffect(() => {
    if (!existingAddress?.coordinates) {
      (async () => {
        await requestLocationPermission();
        const cachedLocation = await Location.getLastKnownPositionAsync();
        if (cachedLocation) {
          const coords = {
            latitude: cachedLocation.coords.latitude,
            longitude: cachedLocation.coords.longitude,
          };
          await applyLocationSelection(coords);
        }
      })();
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission is required to provide better service.',
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
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant location permission to use this feature.'
          );
          setLocationLoading(false);
          return;
        }
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
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setSearchLoading(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results && results.length > 0) {
        const coords = {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
        await applyLocationSelection(coords);
        setSearchQuery('');
      } else {
        Alert.alert('Not Found', 'Could not find the location. Please try a different search.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'Failed to search location. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const addressData = {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        landmark: address.landmark,
        label: addressType,
        phone: address.phone,
        name: address.name,
        coordinates: address.coordinates,
      };

      const updatedAddress = await addOrUpdateAddress(addressData, false);

      if (updatedAddress) {
        Alert.alert(
          'Success',
          'Address updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error('Failed to update address');
      }
    } catch (error) {
      console.error('Update address error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update address. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1453b4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit address</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.mapCard}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by area, street name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchLoading ? (
              <ActivityIndicator size="small" color="#1453b4" />
            ) : searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : null}
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
              </View>
            )}
            <View style={styles.pinTooltip}>
              <Text style={styles.pinTooltipText}>Place pin on the exact location</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            <Ionicons name="navigate" size={18} color="#1453b4" />
            <Text style={styles.currentLocationText}>Use my current location</Text>
          </TouchableOpacity>

          <View style={styles.deliverToSection}>
            <Text style={styles.deliverToLabel}>Deliver to</Text>
            <TouchableOpacity
              style={styles.deliverToCard}
              onPress={() => setShowDeliverToModal(true)}
            >
              <View style={styles.deliverToLeft}>
                <Ionicons name="location" size={20} color="#1453b4" />
                <View style={styles.deliverToText}>
                  <Text style={styles.deliverToTitle}>
                    {address.landmark || address.city || 'Select Location'}
                  </Text>
                  <Text style={styles.deliverToAddress} numberOfLines={1}>
                    {secondaryAddressLine || 'Tap to set address'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={() => setShowDeliverToModal(false)}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.updatePinButton}
            onPress={() => setShowDeliverToModal(true)}
          >
            <Text style={styles.updatePinButtonText}>Update pin and proceed</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeliverToModal}
        onRequestClose={() => setShowDeliverToModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deliver to</Text>
              <TouchableOpacity onPress={() => setShowDeliverToModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#FF9800" />
              <Text style={styles.infoText}>
                Ensure your address details are accurate for a smooth service experience
              </Text>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Flat / House no. / Building name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Noble residency 2nd floor 201 door number"
                value={address.street}
                onChangeText={(text) => setAddress({ ...address, street: text })}
                multiline
              />

              <Text style={styles.inputLabel}>Area / Sector / Locality</Text>
              <View style={styles.addressDisplayCard}>
                <Text style={styles.addressDisplayText}>
                  {[address.landmark, address.city, address.state, address.zipCode].filter(Boolean).join(', ') || 'No address selected'}
                </Text>
                <TouchableOpacity 
                  style={styles.changeButtonSmall}
                  onPress={() => setShowDeliverToModal(false)}
                >
                  <Text style={styles.changeButtonTextSmall}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Enter your full name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={address.name}
                onChangeText={(text) => setAddress({ ...address, name: text })}
              />

              <Text style={styles.inputLabel}>10-digit mobile number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Number "
                value={address.phone}
                onChangeText={(text) => setAddress({ ...address, phone: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Alternate phone number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter alternate number"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Type of address</Text>
              <View style={styles.addressTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.addressTypeButton,
                    addressType === 'Home' && styles.addressTypeButtonActive,
                  ]}
                  onPress={() => setAddressType('Home')}
                >
                  <Ionicons
                    name="home"
                    size={20}
                    color={addressType === 'Home' ? '#1453b4' : '#666'}
                  />
                  <Text
                    style={[
                      styles.addressTypeText,
                      addressType === 'Home' && styles.addressTypeTextActive,
                    ]}
                  >
                    Home
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.addressTypeButton,
                    addressType === 'Work' && styles.addressTypeButtonActive,
                  ]}
                  onPress={() => setAddressType('Work')}
                >
                  <Ionicons
                    name="briefcase"
                    size={20}
                    color={addressType === 'Work' ? '#1453b4' : '#666'}
                  />
                  <Text
                    style={[
                      styles.addressTypeText,
                      addressType === 'Work' && styles.addressTypeTextActive,
                    ]}
                  >
                    Work
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.updateButton, loading && styles.updateButtonDisabled]}
                onPress={handleUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.updateButtonText}>Update address</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  contentContainer: {
    paddingBottom: 32,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#212529',
  },
  mapContainer: {
    height: 300,
    width: '100%',
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
  pinTooltip: {
    position: 'absolute',
    top: 80,
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pinTooltipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1453b4',
    fontWeight: '600',
  },
  deliverToSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  deliverToLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
  },
  deliverToCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  deliverToLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deliverToText: {
    marginLeft: 12,
    flex: 1,
  },
  deliverToTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  deliverToAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1453b4',
  },
  changeButtonText: {
    fontSize: 14,
    color: '#1453b4',
    fontWeight: '600',
  },
  updatePinButton: {
    backgroundColor: '#1453b4',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updatePinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
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
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addressDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addressDisplayText: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
  },
  changeButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1453b4',
  },
  changeButtonTextSmall: {
    fontSize: 12,
    color: '#1453b4',
    fontWeight: '600',
  },
  addressTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addressTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  addressTypeButtonActive: {
    borderColor: '#1453b4',
    backgroundColor: '#F0F8FF',
  },
  addressTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  addressTypeTextActive: {
    color: '#1453b4',
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#1453b4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
