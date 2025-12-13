import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import api from '../config/api';

const LocationSelectionScreen = ({ navigation, route }) => {
  const { currentAddress, setCurrentAddress } = useApp();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(currentAddress?._id || null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/addresses');
      if (response.data.status === 'success') {
        setAddresses(response.data.data.addresses || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.street || !newAddress.city) {
      Alert.alert('Error', 'Please fill in street and city');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/addresses', newAddress);
      if (response.data.status === 'success') {
        const createdAddress = response.data.data.address;
        setCurrentAddress(createdAddress);
        
        if (route.params?.fromOrderReview) {
          navigation.navigate('OrderReview');
        } else {
          navigation.goBack();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = async (address) => {
    try {
      setCurrentAddress(address);
      
      if (route.params?.fromOrderReview) {
        navigation.navigate('OrderReview');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select address');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1453b4" />
          </View>
        ) : (
          <>
            {addresses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Addresses</Text>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address._id}
                    style={[
                      styles.addressCard,
                      selectedAddress === address._id && styles.addressCardSelected,
                    ]}
                    onPress={() => handleSelectAddress(address)}
                  >
                    <View style={styles.addressCardContent}>
                      <View style={styles.addressCardHeader}>
                        <Text style={styles.addressLabel}>{address.label || 'Address'}</Text>
                        {selectedAddress === address._id && (
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        )}
                      </View>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {[address.street, address.city, address.state, address.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                      {address.phone && (
                        <Text style={styles.addressPhone}>{address.phone}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={() => setShowAddNew(!showAddNew)}
              >
                <Ionicons name="add-circle" size={24} color="#1453b4" />
                <Text style={styles.addNewButtonText}>Add New Address</Text>
              </TouchableOpacity>

              {showAddNew && (
                <View style={styles.formContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Address Label (e.g., Home, Office)"
                    value={newAddress.label}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, label: text })
                    }
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Street Address"
                    value={newAddress.street}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, street: text })
                    }
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={newAddress.city}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, city: text })
                    }
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    value={newAddress.state}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, state: text })
                    }
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Zip Code"
                    value={newAddress.zipCode}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, zipCode: text })
                    }
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={newAddress.phone}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, phone: text })
                    }
                    placeholderTextColor="#9CA3AF"
                  />

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddNewAddress}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Address</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  addressCardSelected: {
    borderColor: '#1453b4',
    backgroundColor: '#EFF6FF',
  },
  addressCardContent: {
    flex: 1,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  addressPhone: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1453b4',
  },
  addNewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1453b4',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#1453b4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default LocationSelectionScreen;
