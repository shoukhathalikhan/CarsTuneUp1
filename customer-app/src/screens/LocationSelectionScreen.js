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
  const [editingAddress, setEditingAddress] = useState(null);
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
      if (editingAddress) {
        const response = await api.put(`/users/addresses/${editingAddress._id}`, newAddress);
        if (response.data.status === 'success') {
          await fetchAddresses();
          setShowAddNew(false);
          setEditingAddress(null);
          setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', phone: '' });
          Alert.alert('Success', 'Address updated successfully');
        }
      } else {
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
      }
    } catch (error) {
      Alert.alert('Error', editingAddress ? 'Failed to update address. Please try again.' : 'Failed to add address. Please try again.');
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

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setNewAddress({
      label: address.label || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      phone: address.phone || '',
    });
    setShowAddNew(true);
  };

  const handleDeleteAddress = (address) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete ${address.label || 'this address'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/users/addresses/${address._id}`);
              await fetchAddresses();
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
                  <View key={address._id} style={styles.addressCardWrapper}>
                    <TouchableOpacity
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
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditAddress(address)}
                      >
                        <Ionicons name="pencil-outline" size={18} color="#1453b4" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteAddress(address)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={() => {
                  setEditingAddress(null);
                  setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', phone: '' });
                  setShowAddNew(!showAddNew);
                }}
              >
                <Ionicons name="add-circle" size={24} color="#1453b4" />
                <Text style={styles.addNewButtonText}>Add New Address</Text>
              </TouchableOpacity>

              {showAddNew && (
                <View style={styles.formContainer}>
                  <Text style={styles.formTitle}>{editingAddress ? 'Edit Address' : 'Add New Address'}</Text>
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

                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowAddNew(false);
                        setEditingAddress(null);
                        setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', phone: '' });
                      }}
                      disabled={loading}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleAddNewAddress}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.saveButtonText}>{editingAddress ? 'Update' : 'Save'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
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
  addressCardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  addressCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
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
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
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
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1453b4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default LocationSelectionScreen;
