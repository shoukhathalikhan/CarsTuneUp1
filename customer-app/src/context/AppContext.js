import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const STORAGE_KEYS = {
  userData: 'userData',
  addresses: '@ctu_addresses',
  vehicles: '@ctu_vehicles',
  archivedVehicles: '@ctu_archivedVehicles',
  selectedAddressId: '@ctu_selectedAddressId',
  selectedVehicleId: '@ctu_selectedVehicleId',
};

const AppContext = createContext(null);

const normalizeVehicleId = (vehicle) => {
  if (!vehicle) return '';
  return String(vehicle.id || vehicle._id || '');
};

const safeParseJson = (value, fallback) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse stored JSON:', error);
    return fallback;
  }
};

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [addresses, setAddresses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [archivedVehicles, setArchivedVehicles] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const persistVehicles = async (nextVehicles, nextArchived, nextSelectedId = undefined) => {
    setVehicles(nextVehicles);
    setArchivedVehicles(nextArchived);

    const resolvedSelectedId =
      nextSelectedId !== undefined ? nextSelectedId : selectedVehicleId;

    if (nextSelectedId !== undefined) {
      setSelectedVehicleId(nextSelectedId);
    }

    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.vehicles, JSON.stringify(nextVehicles)],
        [STORAGE_KEYS.archivedVehicles, JSON.stringify(nextArchived)],
        [STORAGE_KEYS.selectedVehicleId, resolvedSelectedId || ''],
      ]);
    } catch (error) {
      console.error('Error persisting vehicles:', error);
    }
  };

  const refreshAddresses = useCallback(async () => {
    try {
      const response = await api.get('/users/addresses');
      const nextAddresses = response.data?.data?.addresses || [];

      let resolvedSelectedId = selectedAddressId;

      if (!nextAddresses.length) {
        resolvedSelectedId = null;
      } else if (
        !resolvedSelectedId ||
        !nextAddresses.some((address) => address.id === resolvedSelectedId)
      ) {
        resolvedSelectedId = nextAddresses[0]?.id || null;
      }

      await persistAddresses(nextAddresses, resolvedSelectedId);
      return nextAddresses;
    } catch (error) {
      console.error('Error refreshing addresses:', error);
      return null;
    }
  }, [selectedAddressId]);

  const refreshVehicles = useCallback(async () => {
    try {
      const response = await api.get('/users/vehicles');
      const nextVehicles = response.data?.data?.vehicles || [];
      const nextArchived = response.data?.data?.archivedVehicles || [];

      let resolvedSelectedId = selectedVehicleId;

      if (!nextVehicles.length) {
        resolvedSelectedId = null;
      } else if (
        !resolvedSelectedId ||
        !nextVehicles.some((vehicle) => vehicle.id === resolvedSelectedId)
      ) {
        resolvedSelectedId = nextVehicles[0]?.id || null;
      }

      await persistVehicles(nextVehicles, nextArchived, resolvedSelectedId);
      return nextVehicles;
    } catch (error) {
      console.error('Error refreshing vehicles:', error);
      return null;
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    const initializeState = async () => {
      try {
        const [
          storedAddresses,
          storedVehicles,
          storedArchived,
          storedSelectedAddressId,
          storedSelectedVehicleId,
          storedUserData,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.addresses),
          AsyncStorage.getItem(STORAGE_KEYS.vehicles),
          AsyncStorage.getItem(STORAGE_KEYS.archivedVehicles),
          AsyncStorage.getItem(STORAGE_KEYS.selectedAddressId),
          AsyncStorage.getItem(STORAGE_KEYS.selectedVehicleId),
          AsyncStorage.getItem(STORAGE_KEYS.userData),
        ]);

        if (storedAddresses) {
          setAddresses(safeParseJson(storedAddresses, []));
        }

        if (storedVehicles) {
          setVehicles(safeParseJson(storedVehicles, []));
        }

        if (storedArchived) {
          setArchivedVehicles(safeParseJson(storedArchived, []));
        }

        if (storedSelectedAddressId) {
          setSelectedAddressId(storedSelectedAddressId || null);
        }

        if (storedSelectedVehicleId) {
          setSelectedVehicleId(storedSelectedVehicleId || null);
        }

        if (storedUserData) {
          await refreshVehicles();

          try {
            const addressesResponse = await api.get('/users/addresses');
            setAddresses(addressesResponse.data.data.addresses || []);
          } catch (error) {
            console.error('Error fetching addresses:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing state:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeState();
  }, [refreshVehicles]);

  const addOrUpdateAddress = async (address, makeCurrent = true) => {
    if (!address) return null;

    try {
      let response;
      const existingIndex = addresses.findIndex((item) => item.id === address.id);

      if (existingIndex >= 0 && address.id) {
        response = await api.put(`/users/addresses/${address.id}`, address);
      } else {
        response = await api.post('/users/addresses', address);
      }

      const updatedAddress = response.data.data.address;
      const nextAddresses = [...addresses];

      if (existingIndex >= 0) {
        nextAddresses[existingIndex] = updatedAddress;
      } else {
        nextAddresses.push(updatedAddress);
      }

      await persistAddresses(nextAddresses, makeCurrent ? updatedAddress.id : undefined);
      return updatedAddress;
    } catch (error) {
      console.error('Error saving address:', error);
      return await addOrUpdateAddressLocal(address, makeCurrent);
    }
  };

  const addOrUpdateAddressLocal = async (address, makeCurrent = true) => {
    const id = address?.id || `${Date.now()}`;
    const nextAddress = { ...address, id };
    const existingIndex = addresses.findIndex((item) => item.id === id);
    const nextAddresses = [...addresses];

    if (existingIndex >= 0) {
      nextAddresses[existingIndex] = nextAddress;
    } else {
      nextAddresses.push(nextAddress);
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

  const addOrUpdateVehicleLocal = async (vehicle, makeCurrent = true) => {
    const id = vehicle?.id || `${Date.now()}`;
    const nextVehicle = { ...vehicle, id };
    const existingIndex = vehicles.findIndex((item) => item.id === id);
    const nextVehicles = [...vehicles];

    if (existingIndex >= 0) {
      nextVehicles[existingIndex] = nextVehicle;
    } else {
      nextVehicles.push(nextVehicle);
    }

    const filteredArchived = archivedVehicles.filter(
      (item) => normalizeVehicleId(item) !== normalizeVehicleId(nextVehicle)
    );

    await persistVehicles(nextVehicles, filteredArchived, makeCurrent ? id : undefined);
    return nextVehicle;
  };

  const addOrUpdateVehicle = async (vehicle, makeCurrent = true) => {
    if (!vehicle) return null;

    try {
      const existingIndex = vehicles.findIndex((item) => item.id === vehicle.id);
      const response =
        existingIndex >= 0 && vehicle.id
          ? await api.put(`/users/vehicles/${vehicle.id}`, vehicle)
          : await api.post('/users/vehicles', vehicle);

      const updatedVehicle = response.data.data.vehicle;
      const nextVehicles = [...vehicles];

      if (existingIndex >= 0) {
        nextVehicles[existingIndex] = updatedVehicle;
      } else {
        nextVehicles.push(updatedVehicle);
      }

      const filteredArchived = archivedVehicles.filter(
        (item) => normalizeVehicleId(item) !== normalizeVehicleId(updatedVehicle)
      );

      await persistVehicles(
        nextVehicles,
        filteredArchived,
        makeCurrent ? updatedVehicle.id : undefined
      );

      return updatedVehicle;
    } catch (error) {
      console.error('Error saving vehicle:', error);
      return await addOrUpdateVehicleLocal(vehicle, makeCurrent);
    }
  };

  const selectVehicle = async (id, options = {}) => {
    const sourceVehicles =
      Array.isArray(options.vehicles) && options.vehicles.length ? options.vehicles : vehicles;

    if (!sourceVehicles.find((item) => item.id === id)) {
      return;
    }

    setSelectedVehicleId(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.selectedVehicleId, id);
    } catch (error) {
      console.error('Error saving selected vehicle ID:', error);
    }
  };

  const upsertArchivedVehicle = (archiveList, vehicle) => {
    const id = normalizeVehicleId(vehicle);
    if (!id) return archiveList;

    const filtered = archiveList.filter((item) => normalizeVehicleId(item) !== id);
    return [...filtered, { ...vehicle, isArchived: true }];
  };

  const deleteAddress = async (addressId) => {
    try {
      const remainingAddresses = addresses.filter((address) => address.id !== addressId);
      const nextSelectedId =
        selectedAddressId === addressId ? remainingAddresses[0]?.id || null : selectedAddressId;

      await persistAddresses(remainingAddresses, nextSelectedId);
      return remainingAddresses;
    } catch (error) {
      console.error('Error deleting address:', error);
      return null;
    }
  };

  const deleteVehicle = async (vehicleId) => {
    try {
      await api.delete(`/users/vehicles/${vehicleId}`);

      const archivedSource = vehicles.find((vehicle) => vehicle.id === vehicleId);
      const remainingVehicles = vehicles.filter((vehicle) => vehicle.id !== vehicleId);
      const nextArchived = archivedSource
        ? upsertArchivedVehicle(archivedVehicles, archivedSource)
        : archivedVehicles;

      const nextSelectedId =
        selectedVehicleId === vehicleId ? remainingVehicles[0]?.id || null : selectedVehicleId;

      await persistVehicles(remainingVehicles, nextArchived, nextSelectedId);
      return remainingVehicles;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return null;
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
    archivedVehicles,
    currentAddress,
    currentVehicle,
    selectedAddressId,
    selectedVehicleId,
    loading,
    addOrUpdateAddress,
    addOrUpdateVehicle,
    selectAddress,
    selectVehicle,
    deleteAddress,
    deleteVehicle,
    refreshAddresses,
    refreshVehicles,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
