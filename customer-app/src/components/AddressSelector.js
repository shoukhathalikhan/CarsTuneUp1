import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { useApp } from '../context/AppContext';

export default function AddressSelector() {
  const { addresses, currentAddress, loading, selectAddress, deleteAddress: deleteAddressFromContext } = useApp();
  const [visible, setVisible] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(null);
  const navigation = useNavigation();

  const handleOpen = () => {
    if (loading) {
      return;
    }
    setVisible(true);
  };

  const handleClose = () => {
    if (savingId) {
      return;
    }
    setVisible(false);
  };

  const syncSelectedAddress = async (item) => {
    try {
      setSavingId(item.id);
      const userDataString = await AsyncStorage.getItem('userData');
      let updatedUser = null;

      if (userDataString) {
        const parsed = JSON.parse(userDataString);
        updatedUser = {
          ...parsed,
          address: {
            street: item.street || '',
            city: item.city || '',
            state: item.state || '',
            zipCode: item.zipCode || '',
            landmark: item.landmark || '',
          },
        };
      } else {
        updatedUser = {
          address: {
            street: item.street || '',
            city: item.city || '',
            state: item.state || '',
            zipCode: item.zipCode || '',
            landmark: item.landmark || '',
          },
        };
      }

      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

      try {
        await api.put('/users/profile', { address: updatedUser.address });
      } catch (error) {
        console.error('Error syncing selected address to server:', error);
      }
    } catch (error) {
      console.error('Error syncing selected address locally:', error);
    } finally {
      setSavingId(null);
    }
  };

  const handleSelect = async (item) => {
    await selectAddress(item.id);
    setVisible(false);
    await syncSelectedAddress(item);
  };

  const handleAddNew = () => {
    setVisible(false);
    const parent = navigation.getParent ? navigation.getParent() : null;
    const nav = parent || navigation;
    nav.navigate('AddressSelection', { fromHome: true });
  };

  const handleEdit = (address) => {
    setMenuVisible(null);
    setVisible(false);
    const parent = navigation.getParent ? navigation.getParent() : null;
    const nav = parent || navigation;
    nav.navigate('EditAddress', { address });
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
              await api.delete(`/users/addresses/${addressId}`);
              await deleteAddressFromContext(addressId);
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleMenu = (addressId) => {
    setMenuVisible(menuVisible === addressId ? null : addressId);
  };

  const label = currentAddress
    ? currentAddress.label || currentAddress.city || 'Other'
    : 'Add address';

  const subLabel = currentAddress
    ? currentAddress.city || currentAddress.street || ''
    : 'Tap to add address';

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        activeOpacity={0.8}
        onPress={handleOpen}
      >
        <Ionicons name="location" size={18} color="rgba(248,250,252,0.9)" />
        <View style={styles.triggerTextContainer}>
          <Text style={styles.triggerTitle} numberOfLines={1}>{label}</Text>
          <Text style={styles.triggerSubtitle} numberOfLines={1}>{subLabel}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="rgba(248,250,252,0.9)" />
        ) : (
          <Ionicons name="chevron-down" size={16} color="rgba(248,250,252,0.9)" />
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Address</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {addresses.map((item) => {
                const isActive = currentAddress && currentAddress.id === item.id;
                const isSaving = savingId === item.id;
                const isMenuOpen = menuVisible === item.id;
                return (
                  <View key={item.id}>
                    <TouchableOpacity
                      style={[styles.item, isActive && styles.itemActive]}
                      activeOpacity={0.85}
                      onPress={() => handleSelect(item)}
                      disabled={!!savingId}
                    >
                      <View style={styles.itemIconWrapper}>
                        <Ionicons
                          name={isActive ? 'location' : 'location-outline'}
                          size={20}
                          color={isActive ? '#1453b4' : '#6b7280'}
                        />
                      </View>
                      <View style={styles.itemTextWrapper}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.label || item.city || 'Address'}
                        </Text>
                        <Text style={styles.itemSubtitle} numberOfLines={2}>
                          {[item.street, item.city, item.state, item.zipCode]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      </View>
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#1453b4" />
                      ) : isActive ? (
                        <Ionicons name="checkmark" size={20} color="#1453b4" />
                      ) : null}
                      <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => toggleMenu(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                    {isMenuOpen && (
                      <View style={styles.menuDropdown}>
                        <TouchableOpacity
                          style={styles.menuOption}
                          onPress={() => handleEdit(item)}
                        >
                          <Ionicons name="pencil" size={18} color="#1453b4" />
                          <Text style={styles.menuOptionText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.menuOption}
                          onPress={() => handleDelete(item.id)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#dc3545" />
                          <Text style={[styles.menuOptionText, styles.deleteText]}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}

              {addresses.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={28} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No saved addresses</Text>
                  <Text style={styles.emptySubtitle}>Add a new address to get started</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.9}
              onPress={handleAddNew}
            >
              <Ionicons name="add" size={20} color="#1453b4" />
              <Text style={styles.addButtonText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerTextContainer: {
    marginHorizontal: 8,
    maxWidth: 160,
  },
  triggerTitle: {
    fontSize: 13,
    color: 'rgba(249,250,251,0.95)',
  },
  triggerSubtitle: {
    fontSize: 11,
    color: 'rgba(249,250,251,0.75)',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  list: {
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 6,
  },
  itemActive: {
    backgroundColor: '#e0edff',
  },
  itemIconWrapper: {
    width: 32,
    alignItems: 'center',
  },
  itemTextWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptyTitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  addButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#1453b4',
  },
  menuButton: {
    padding: 4,
    marginLeft: 8,
  },
  menuDropdown: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuOptionText: {
    fontSize: 15,
    color: '#1453b4',
    marginLeft: 12,
    fontWeight: '500',
  },
  deleteText: {
    color: '#dc3545',
  },
});
