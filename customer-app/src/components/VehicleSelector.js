import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { useApp } from '../context/AppContext';

export default function VehicleSelector() {
  const { vehicles, currentVehicle, loading, selectVehicle, selectedVehicleId, deleteVehicle } = useApp();
  const [visible, setVisible] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const navigation = useNavigation();

  // Get unique models with their vehicles
  const getUniqueModels = () => {
    const modelMap = new Map();
    vehicles.forEach(vehicle => {
      const key = `${vehicle.brand}-${vehicle.model}`;
      if (!modelMap.has(key)) {
        modelMap.set(key, {
          brand: vehicle.brand,
          model: vehicle.model,
          vehicles: [],
          count: 0
        });
      }
      modelMap.get(key).vehicles.push(vehicle);
      modelMap.get(key).count++;
    });
    return Array.from(modelMap.values());
  };

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

  const syncSelectedVehicle = async (item) => {
    try {
      setSavingId(item.id);
      const userDataString = await AsyncStorage.getItem('userData');
      let updatedUser = null;

      if (userDataString) {
        const parsed = JSON.parse(userDataString);
        updatedUser = {
          ...parsed,
          vehicle: {
            brand: item.brand || '',
            model: item.model || '',
          },
        };
      } else {
        updatedUser = {
          vehicle: {
            brand: item.brand || '',
            model: item.model || '',
          },
        };
      }

      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

      try {
        await api.put('/users/profile', { vehicle: updatedUser.vehicle });
      } catch (error) {
        console.error('Error syncing selected vehicle to server:', error);
      }
    } catch (error) {
      console.error('Error syncing selected vehicle locally:', error);
    } finally {
      setSavingId(null);
    }
  };

  const handleSelect = async (item) => {
    await selectVehicle(item.id);
    setVisible(false);
    await syncSelectedVehicle(item);
  };

  const handleAddNew = () => {
    setVisible(false);
    const parent = navigation.getParent ? navigation.getParent() : null;
    const nav = parent || navigation;
    nav.navigate('VehicleSelection', { fromHome: true });
  };

  const handleDeleteModel = (brand, model) => {
    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete all ${brand} ${model} vehicles? This will remove ${vehicles.filter(v => v.brand === brand && v.model === model).length} vehicle(s) from your profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all vehicles of this model
              const vehiclesToDelete = vehicles.filter(v => v.brand === brand && v.model === model);
              for (const vehicle of vehiclesToDelete) {
                await deleteVehicle(vehicle.id);
              }
              
              Alert.alert(
                'Model Deleted',
                `All ${brand} ${model} vehicles have been removed from your profile.`
              );
            } catch (error) {
              console.error('Error deleting model:', error);
              Alert.alert('Error', 'Failed to delete model. Please try again.');
            }
          }
        }
      ]
    );
  };

  const title = currentVehicle
    ? currentVehicle.model || currentVehicle.brand || 'Vehicle'
    : 'Select vehicle';

  const subtitle = currentVehicle
    ? currentVehicle.brand || ''
    : 'Tap to add vehicle';

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        activeOpacity={0.8}
        onPress={handleOpen}
      >
        <Ionicons name="car" size={18} color="rgba(248,250,252,0.9)" />
        <View style={styles.triggerTextContainer}>
          <Text style={styles.triggerTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.triggerSubtitle} numberOfLines={1}>{subtitle}</Text>
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
              <Text style={styles.sheetTitle}>Select Vehicle</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {getUniqueModels().map((item) => {
                const isActive = currentVehicle && currentVehicle.brand === item.brand && currentVehicle.model === item.model;
                return (
                  <View key={`${item.brand}-${item.model}`} style={[styles.itemContainer]}>
                    <TouchableOpacity
                      style={[styles.item, isActive && styles.itemActive]}
                      activeOpacity={0.85}
                      onPress={() => handleSelect(item.vehicles[0])}
                      disabled={!!savingId}
                    >
                      <View style={styles.itemIconWrapper}>
                        <Ionicons
                          name="car-sport"
                          size={22}
                          color={isActive ? '#1453b4' : '#6b7280'}
                        />
                      </View>
                      <View style={styles.itemTextWrapper}>
                        <Text style={[styles.itemTitle, isActive && styles.itemTitleActive]}>
                          {item.brand} {item.model}
                        </Text>
                      </View>
                      {isActive ? (
                        <Ionicons name="checkmark" size={20} color="#1453b4" />
                      ) : null}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteModel(item.brand, item.model)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {vehicles.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <Ionicons name="car-sport-outline" size={28} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No saved vehicles</Text>
                  <Text style={styles.emptySubtitle}>Add a new vehicle to get started</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.9}
              onPress={handleAddNew}
            >
              <Ionicons name="add" size={20} color="#1453b4" />
              <Text style={styles.addButtonText}>Add New Vehicle</Text>
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
    maxWidth: 140,
  },
  triggerTitle: {
    fontSize: 13,
    color: 'rgba(249,250,251,0.95)',
    textAlign: 'right',
  },
  triggerSubtitle: {
    fontSize: 11,
    color: 'rgba(249,250,251,0.75)',
    textAlign: 'right',
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
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemActive: {
    backgroundColor: '#e0edff',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  itemTitleActive: {
    color: '#1453b4',
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
});
