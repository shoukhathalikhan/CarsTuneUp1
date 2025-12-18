import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import api from '../config/api';

export default function SavedAddressesScreen({ navigation }) {
  const { addresses, refreshAddresses, deleteAddress: deleteAddressFromContext } = useApp();
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(null);

  useEffect(() => {
    refreshAddresses();
  }, []);

  const handleAddNew = () => {
    navigation.navigate('AddressSelection', { fromProfile: true });
  };

  const handleEdit = (address) => {
    setMenuVisible(null);
    navigation.navigate('EditAddress', { address });
  };

  const handleDelete = async (addressId) => {
    setMenuVisible(null);
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/users/addresses/${addressId}`);
              await deleteAddressFromContext(addressId);
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleMenu = (addressId) => {
    setMenuVisible(menuVisible === addressId ? null : addressId);
  };

  const getAddressIcon = (label) => {
    if (label?.toLowerCase().includes('home')) return 'home';
    if (label?.toLowerCase().includes('work')) return 'briefcase';
    return 'location';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1453b4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity onPress={handleAddNew}>
          <Text style={styles.addNewText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1453b4" />
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No saved addresses</Text>
            <Text style={styles.emptySubtext}>Add a new address to get started</Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={getAddressIcon(address.label)}
                    size={24}
                    color="#1453b4"
                  />
                </View>
                <View style={styles.addressDetails}>
                  <Text style={styles.addressLabel}>
                    {address.label || address.city || 'Address'}
                  </Text>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {[address.street, address.city, address.state, address.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                  {address.phone && (
                    <Text style={styles.phoneText}>{address.phone}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => toggleMenu(address.id)}
                >
                  <Ionicons name="ellipsis-vertical" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {menuVisible === address.id && (
                <View style={styles.menuDropdown}>
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => handleEdit(address)}
                  >
                    <Ionicons name="pencil" size={20} color="#1453b4" />
                    <Text style={styles.menuOptionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => handleDelete(address.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc3545" />
                    <Text style={[styles.menuOptionText, styles.deleteText]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
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
  },
  addNewText: {
    fontSize: 16,
    color: '#1453b4',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  menuButton: {
    padding: 4,
  },
  menuDropdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  menuOptionText: {
    fontSize: 16,
    color: '#1453b4',
    marginLeft: 12,
    fontWeight: '500',
  },
  deleteText: {
    color: '#dc3545',
  },
});
