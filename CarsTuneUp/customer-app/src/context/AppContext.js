import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const STORAGE_KEYS = {
  userData: 'userData',
  addresses: '@ctu_addresses',
  vehicles: '@ctu_vehicles',
  selectedAddressId: '@ctu_selectedAddressId',
  selectedVehicleId: '@ctu_selectedVehicleId',
};

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [addresses, setAddresses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshVehicles = useCallback(async () => {
    try {
      const response = await api.get('/users/vehicles');
      const nextVehicles = response.data?.data?.vehicles || [];

      setVehicles(nextVehicles);

      if (nextVehicles.length === 0) {
        setSelectedVehicleId(null);
        await AsyncStorage.setItem(STORAGE_KEYS.selectedVehicleId, '');
        return nextVehicles;
      }

      let nextSelectedId = selectedVehicleId;
      if (!nextSelectedId || !nextVehicles.find((vehicle) => vehicle.id === nextSelectedId)) {
        nextSelectedId = nextVehicles[0].id;
        setSelectedVehicleId(nextSelectedId);
        await AsyncStorage.setItem(STORAGE_KEYS.selectedVehicleId, nextSelectedId);
      }

      return nextVehicles;
    } catch (error) {
      console.error('Error refreshing vehicles:', error);
      return null;
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    initializeState();
  }, []);

  const initializeState = async () => {
    try {
      // Get user data from AsyncStorage
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      
      if (userData) {
        const user = JSON.parse(userData);
        
        await refreshVehicles();
        
        // Fetch addresses from server
        try {
          const addressesResponse = await api.get('/users/addresses');
          setAddresses(addressesResponse.data.data.addresses || []);
        } catch (error) {
          console.error('Error fetching addresses:', error);
          setAddresses([]);
        }
        
        // Set selected items from local storage
        const selectedVehicleId = await AsyncStorage.getItem(STORAGE_KEYS.selectedVehicleId);
        const selectedAddressId = await AsyncStorage.getItem(STORAGE_KEYS.selectedAddressId);
        
        if (selectedVehicleId) setSelectedVehicleId(selectedVehicleId);
        if (selectedAddressId) setSelectedAddressId(selectedAddressId);
      }
    } catch (error) {
      console.error('Error initializing state:', error);
    } finally {
      setLoading(false);
    }
  };

  const persistAddresses = async (nextAddresses, nextSelectedId) => {
    setAddresses(nextAddresses);
    const idToStore = nextSelectedId !== undefined ? nextSelectedId : selectedAddressId;
    if (nextSelectedId !== undefined) {
      setSelectedAddressId(nextSelectedId);
    }

    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.addresses, JSON.stringify(nextAddresses)],
        [STORAGE_KEYS.selectedAddressId, idToStore || ''],
      ]);
    } catch (error) {
      console.error('Error persisting addresses:', error);
    }
  };

  const persistVehicles = async (nextVehicles, nextSelectedId) => {
    setVehicles(nextVehicles);
    const idToStore = nextSelectedId !== undefined ? nextSelectedId : selectedVehicleId;
    if (nextSelectedId !== undefined) {
      setSelectedVehicleId(nextSelectedId);
    }

    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.vehicles, JSON.stringify(nextVehicles)],
        [STORAGE_KEYS.selectedVehicleId, idToStore || ''],
      ]);
    } catch (error) {
      console.error('Error persisting vehicles:', error);
    }
  };

  const addOrUpdateAddress = async (address, makeCurrent = true) => {
    if (!address) return null;

    try {
      let response;
      const existingIndex = addresses.findIndex((item) => item.id === address.id);

      if (existingIndex >= 0 && address.id) {
        // Update existing address
        response = await api.put(`/users/addresses/${address.id}`, address);
      } else {
        // Add new address
        response = await api.post('/users/addresses', address);
      }

      const updatedAddress = response.data.data.address;
      
      // Update local state
      let nextAddresses;
      if (existingIndex >= 0) {
        nextAddresses = [...addresses];
        nextAddresses[existingIndex] = updatedAddress;
      } else {
        nextAddresses = [...addresses, updatedAddress];
      }

      setAddresses(nextAddresses);
      
      if (makeCurrent) {
        setSelectedAddressId(updatedAddress.id);
        await AsyncStorage.setItem(STORAGE_KEYS.selectedAddressId, updatedAddress.id);
      }

      return updatedAddress;
    } catch (error) {
      console.error('Error saving address:', error);
      // Fallback to local storage if API fails
      return await addOrUpdateAddressLocal(address, makeCurrent);
    }
  };

  const addOrUpdateAddressLocal = async (address, makeCurrent = true) => {
    const id = address.id || `${Date.now()}`;
    const nextAddress = { ...address, id };
    const existingIndex = addresses.findIndex((item) => item.id === id);

    let nextAddresses;
    if (existingIndex >= 0) {
      nextAddresses = [...addresses];
      nextAddresses[existingIndex] = nextAddress;
    } else {
      nextAddresses = [...addresses, nextAddress];
    }

    await persistAddresses(nextAddresses, makeCurrent ? id : undefined);
    return nextAddress;
  };

  const selectAddress = async (id) => {
    if (!addresses.find((item) => item.id === id)) {
      return;
    }

    setSelectedAddressId(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.selectedAddressId, id);
    } catch (error) {
      console.error('Error saving selected address ID:', error);
    }
  };

  const addOrUpdateVehicle = async (vehicle, makeCurrent = true) => {
    if (!vehicle) return null;

    try {
      let response;
      const existingIndex = vehicles.findIndex((item) => item.id === vehicle.id);

      if (existingIndex >= 0 && vehicle.id) {
        // Update existing vehicle
        response = await api.put(`/users/vehicles/${vehicle.id}`, vehicle);
      } else {
        // Add new vehicle
        response = await api.post('/users/vehicles', vehicle);
      }

      const updatedVehicle = response.data.data.vehicle;
      
      // Update local state
      let nextVehicles;
      if (existingIndex >= 0) {
        nextVehicles = [...vehicles];
        nextVehicles[existingIndex] = updatedVehicle;
      } else {
        nextVehicles = [...vehicles, updatedVehicle];
      }

      setVehicles(nextVehicles);
      
      if (makeCurrent) {
        setSelectedVehicleId(updatedVehicle.id);
        await AsyncStorage.setItem(STORAGE_KEYS.selectedVehicleId, updatedVehicle.id);
      }

      return updatedVehicle;
    } catch (error) {
      console.error('Error saving vehicle:', error);
      // Fallback to local storage if API fails
      return await addOrUpdateVehicleLocal(vehicle, makeCurrent);
    }
  };

  const addOrUpdateVehicleLocal = async (vehicle, makeCurrent = true) => {
    const id = vehicle.id || `${Date.now()}`;
    const nextVehicle = { ...vehicle, id };
    const existingIndex = vehicles.findIndex((item) => item.id === id);

    let nextVehicles;
    if (existingIndex >= 0) {
      nextVehicles = [...vehicles];
      nextVehicles[existingIndex] = nextVehicle;
    } else {
      nextVehicles = [...vehicles, nextVehicle];
    }

    await persistVehicles(nextVehicles, makeCurrent ? id : undefined);
    return nextVehicle;
  };

  const selectVehicle = async (id) => {
    if (!vehicles.find((item) => item.id === id)) {
      return;
    }

    setSelectedVehicleId(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.selectedVehicleId, id);
    } catch (error) {
      console.error('Error saving selected vehicle ID:', error);
    }
  };

  const deleteVehicle = async (vehicleId) => {
    try {
      // Delete from server
      await api.delete(`/users/vehicles/${vehicleId}`);
      
      // Update local state
      const nextVehicles = vehicles.filter(v => v.id !== vehicleId);
      
      // Handle selection when deleting the currently selected vehicle
      if (selectedVehicleId === vehicleId) {
        const nextSelectedId = nextVehicles.length > 0 ? nextVehicles[0].id : null;
        setSelectedVehicleId(nextSelectedId);
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.selectedVehicleId, nextSelectedId || '');
        } catch (error) {
          console.error('Error updating selected vehicle ID:', error);
        }
      }
      
      setVehicles(nextVehicles);
      return nextVehicles;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      // Fallback to local storage if API fails
      const nextVehicles = vehicles.filter(v => v.id !== vehicleId);
      
      if (selectedVehicleId === vehicleId) {
        const nextSelectedId = nextVehicles.length > 0 ? nextVehicles[0].id : null;
        setSelectedVehicleId(nextSelectedId);
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.selectedVehicleId, nextSelectedId || '');
        } catch (error) {
          console.error('Error updating selected vehicle ID:', error);
        }
      }
      
      await persistVehicles(nextVehicles);
      return nextVehicles;
    }
  };

  const currentAddress = useMemo(() => {
    if (!addresses.length) return null;
    return addresses.find((item) => item.id === selectedAddressId) || addresses[0];
  }, [addresses, selectedAddressId]);

  const currentVehicle = useMemo(() => {
    if (!vehicles.length) return null;
    return vehicles.find((item) => item.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  const value = {
    addresses,
    vehicles,
    currentAddress,
    currentVehicle,
    selectedAddressId,
    selectedVehicleId,
    loading,
    addOrUpdateAddress,
    addOrUpdateVehicle,
    selectAddress,
    selectVehicle,
    deleteVehicle,
    refreshVehicles,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
