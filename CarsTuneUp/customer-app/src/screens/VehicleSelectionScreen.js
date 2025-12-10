import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { useApp } from '../context/AppContext';

const normalizeVehicleType = (value) => {
  if (!value || typeof value !== 'string') {
    return 'hatchback-sedan';
  }
  const lower = value.toLowerCase();
  if (lower.includes('suv') || lower.includes('muv')) {
    return 'suv-muv';
  }
  return 'hatchback-sedan';
};

const resolveImageSource = (url) => {
  if (url && url.startsWith('http')) {
    return { uri: url };
  }

  if (url) {
    const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return { uri: `${base}${normalizedPath}` };
  }

  return null;
};

export default function VehicleSelectionScreen({ navigation, route }) {
  const { fromProfile = false, fromHome = false } = route.params || {};
  const { refreshVehicles, vehicles, selectVehicle, selectedVehicleId, deleteVehicle } = useApp();
  
  const [step, setStep] = useState(1); // 1: Brand, 2: Model
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState('');
  const [showVehicleList, setShowVehicleList] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBrands = async () => {
      try {
        setBrandsLoading(true);
        setBrandsError('');

        const response = await api.get('/brands', {
          params: { isActive: true }
        });

        if (!isMounted) return;

        console.log('Raw API response:', response.data);
        console.log('Brands data:', response.data?.data?.brands);

        const remoteBrands = response.data?.data?.brands || [];
        const formattedBrands = remoteBrands
          .filter((brand) => brand.isActive !== false)
          .map((brand) => ({
            id: brand._id,
            name: brand.name,
            logo: brand.logo,
            models: (brand.models || [])
              .filter((model) => model.isActive !== false)
              .map((model) => {
                if (typeof model === 'string') {
                  return { name: model, image: '', serviceType: 'hatchback-sedan' };
                }
                return {
                  ...model,
                  serviceType: normalizeVehicleType(model.serviceType),
                };
              })
          }))
          .filter((brand) => brand.models.length > 0);

        setBrands(formattedBrands);

        if (formattedBrands.length === 0) {
          setBrandsError('No active car brands available.');
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
        if (isMounted) {
          setBrandsError('Failed to load car brands. Pull to refresh or try again later.');
        }
      } finally {
        if (isMounted) {
          setBrandsLoading(false);
        }
      }
    };

    fetchBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const currentBrand = brands.find((brand) => brand.name === selectedBrand);

  const filteredModels = useMemo(() => {
    if (!currentBrand) return [];
    return currentBrand.models
      .filter((model) => {
        const modelName = typeof model === 'string' ? model : model.name;
        return modelName.toLowerCase().includes(modelSearch.toLowerCase());
      })
      .map((model) => {
        if (typeof model === 'string') {
          return { name: model, image: '', serviceType: 'hatchback-sedan' };
        }
        return {
          ...model,
          serviceType: normalizeVehicleType(model.serviceType),
        };
      });
  }, [currentBrand, modelSearch]);

  // Debug logging to see model structure
  if (currentBrand && currentBrand.models.length > 0) {
    console.log('Current brand models:', currentBrand.models);
    console.log('Filtered models:', filteredModels);
    console.log('First model structure:', currentBrand.models[0]);
  }

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setStep(2);
    setModelSearch('');
  };

  const handleModelSelect = async (model) => {
    const modelName = typeof model === 'string' ? model : model.name;
    setSelectedModel(modelName);
    setLoading(true);

    try {
      const resolvedType = normalizeVehicleType(
        typeof model === 'string' ? null : model?.serviceType
      );

      const vehicleData = {
        brand: selectedBrand,
        model: modelName,
        type: resolvedType,
      };

      const response = await api.post('/users/vehicles', vehicleData);
      console.log('Vehicle save response:', response.data);

      const savedVehicle = response.data.data.vehicle;
      
      await refreshVehicles();
      await selectVehicle(savedVehicle.id);

      Alert.alert(
        'Success',
        'Vehicle added successfully! You can now manage multiple vehicles of the same model.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (fromProfile) {
                navigation.navigate('MainTabs', { screen: 'Profile' });
              } else if (fromHome) {
                navigation.goBack();
              } else {
                navigation.replace('MainTabs');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving vehicle:', error);
      Alert.alert('Error', 'Failed to save vehicle information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedBrand('');
      setSelectedModel('');
    } else if (fromProfile) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } else {
      // During onboarding, go back to address selection
      navigation.navigate('AddressSelection');
    }
  };

  const handleSkip = () => {
    if (fromProfile) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
      return;
    }

    Alert.alert(
      'Skip Vehicle Selection',
      'You can add your vehicle details later from the profile section.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.replace('MainTabs')
        }
      ]
    );
  };

  const handleDeleteVehicle = (vehicleId) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle? This will remove it from your profile and pricing will be reset to base rates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicleId);
              
              Alert.alert(
                'Vehicle Deleted',
                'Vehicle has been removed from your profile. Pricing will be updated accordingly.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (fromProfile) {
                        navigation.navigate('MainTabs', { screen: 'Profile' });
                      } else {
                        navigation.goBack();
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
            }
          }
        }
      ]
    );
  };

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
                `All ${brand} ${model} vehicles have been removed from your profile.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (fromProfile) {
                        navigation.navigate('MainTabs', { screen: 'Profile' });
                      } else {
                        navigation.goBack();
                      }
                    }
                  }
                ]
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

  const handleSelectExistingVehicle = (vehicle) => {
    selectVehicle(vehicle.id);
    Alert.alert(
      'Vehicle Selected',
      `${vehicle.brand} ${vehicle.model} is now your active vehicle. Pricing will be updated accordingly.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (fromProfile) {
              navigation.navigate('MainTabs', { screen: 'Profile' });
            } else if (fromHome) {
              navigation.goBack();
            } else {
              navigation.replace('MainTabs');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1453b4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showVehicleList ? 'Manage Vehicles' : step === 1 ? 'Select Your Car Brand' : 'Select Your Car Model'}
        </Text>
        {showVehicleList ? (
          <TouchableOpacity onPress={() => setShowVehicleList(false)}>
            <Text style={styles.skipText}>Add New</Text>
          </TouchableOpacity>
        ) : fromProfile || fromHome ? (
          <TouchableOpacity onPress={() => setShowVehicleList(true)}>
            <Text style={styles.skipText}>My Vehicles</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Vehicle Management Section */}
      {showVehicleList && (
        <View style={styles.vehicleManagementContainer}>
          <Text style={styles.sectionTitle}>Your Vehicles</Text>
          {vehicles.length === 0 ? (
            <View style={styles.emptyVehiclesContainer}>
              <Ionicons name="car-outline" size={48} color="#ccc" />
              <Text style={styles.emptyVehiclesText}>No vehicles added yet</Text>
              <TouchableOpacity 
                style={styles.addFirstVehicleButton}
                onPress={() => setShowVehicleList(false)}
              >
                <Ionicons name="plus" size={20} color="#fff" />
                <Text style={styles.addFirstVehicleText}>Add Your First Vehicle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={getUniqueModels()}
              keyExtractor={(item) => `${item.brand}-${item.model}`}
              renderItem={({ item }) => (
                <View style={[
                  styles.vehicleItem,
                  selectedVehicleId && vehicles.find(v => v.id === selectedVehicleId)?.brand === item.brand && vehicles.find(v => v.id === selectedVehicleId)?.model === item.model && styles.selectedVehicleItem
                ]}>
                  <TouchableOpacity 
                    style={styles.vehicleInfo}
                    onPress={() => handleSelectExistingVehicle(item.vehicles[0])}
                  >
                    <View style={styles.vehicleIcon}>
                      <Ionicons name="car" size={24} color="#1453b4" />
                    </View>
                    <View style={styles.vehicleDetails}>
                      <Text style={styles.vehicleName}>{item.brand} {item.model}</Text>
                      <Text style={styles.vehicleSubtitle}>
                        {item.count > 1 ? `${item.count} vehicles` : '1 vehicle'}
                      </Text>
                      <Text style={styles.vehicleStatus}>
                        {selectedVehicleId && vehicles.find(v => v.id === selectedVehicleId)?.brand === item.brand && vehicles.find(v => v.id === selectedVehicleId)?.model === item.model 
                          ? 'Currently Active' : 'Tap to activate'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteModel(item.brand, item.model)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={styles.vehicleListContainer}
            />
          )}
        </View>
      )}

      {/* Progress Indicator */}
      {!showVehicleList && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        </View>
      )}

      {/* Search Bar */}
      {!showVehicleList && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={step === 1 ? 'Search brand...' : 'Search model...'}
            value={step === 1 ? brandSearch : modelSearch}
            onChangeText={step === 1 ? setBrandSearch : setModelSearch}
          />
        </View>
      )}

      {/* List */}
      {!showVehicleList && (
        <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 24 }}>
          {step === 1 ? (
            brandsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1453b4" />
                <Text style={styles.loadingText}>Loading car brands...</Text>
              </View>
            ) : filteredBrands.length > 0 ? (
              <View style={styles.brandGrid}>
                {filteredBrands.map((brand) => (
                  <TouchableOpacity
                    key={brand.id || brand.name}
                    style={styles.brandCard}
                    onPress={() => handleBrandSelect(brand.name)}
                  >
                    <View style={styles.brandLogoWrapper}>
                      {brand.logo ? (
                        <>
                          {console.log('Brand logo URL:', brand.logo)}
                          <Image
                            source={{ uri: brand.logo }}
                            style={styles.brandLogo}
                            resizeMode="cover"
                            onError={(error) => {
                              console.log('Brand logo load error:', error);
                            }}
                          />
                        </>
                      ) : (
                        <Ionicons name="car-sport" size={28} color="#1453b4" />
                      )}
                    </View>
                    <Text style={styles.brandCardLabel} numberOfLines={1}>{brand.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle" size={32} color="#999" />
                <Text style={styles.emptyStateTitle}>No Brands Available</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {brandsError || 'Please contact support to add car brands.'}
                </Text>
              </View>
            )
          ) : (
            // Model Selection - 3 Column Grid
            <View style={styles.modelGridContainer}>
              {filteredModels.map((model) => {
                const hasImage = model.image && model.image.trim() !== '' && model.image !== 'undefined';
                console.log('Rendering model:', model.name, 'has image:', hasImage, 'image URL:', model.image);
                console.log('Full model object:', model);
                const resolvedImage = hasImage ? resolveImageSource(model.image) : null;
                console.log('Resolved image source:', resolvedImage);
                return (
                  <TouchableOpacity
                    key={model._id || model.name}
                    style={[
                      styles.modelGridItem,
                      selectedModel === model.name && styles.selectedModelGridItem
                    ]}
                    onPress={() => handleModelSelect(model)}
                    disabled={loading}
                  >
                    <View style={styles.modelImageContainer}>
                      {hasImage && resolvedImage ? (
                        <Image 
                          source={resolvedImage} 
                          style={styles.modelGridImage}
                          resizeMode="contain"
                          onError={(error) => {
                            console.log('Image load error:', error);
                            console.log('Failed to load image for model:', model.name);
                          }}
                        />
                      ) : (
                        <View style={styles.modelGridIcon}>
                          <Ionicons name="car" size={32} color="#1453b4" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.modelGridText} numberOfLines={2}>
                      {model.name}
                    </Text>
                    {loading && selectedModel === model.name ? (
                      <ActivityIndicator size="small" color="#1453b4" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Selected Info */}
      {!showVehicleList && selectedBrand && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedLabel}>Selected:</Text>
          <Text style={styles.selectedText}>
            {selectedBrand}{selectedModel ? ` - ${selectedModel}` : ''}
          </Text>
        </View>
      )}
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: '#1453b4',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  progressLineActive: {
    backgroundColor: '#1453b4',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#212529',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  brandCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  brandLogoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandCardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modelImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 16,
  },
  // Model Grid Styles
  modelGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  modelGridItem: {
    width: '42%',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 2,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedModelGridItem: {
    borderColor: '#1453b4',
    backgroundColor: 'transparent',
  },
  modelImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  modelGridImage: {
    width: '100%',
    height: '100%',
  },
  modelGridIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  modelGridText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
    lineHeight: 14,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 12,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },
  selectedInfo: {
    backgroundColor: '#E7F3FF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1453b4',
  },
  selectedLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1453b4',
  },
  // Vehicle Management Styles
  vehicleManagementContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  emptyVehiclesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyVehiclesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
  },
  addFirstVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1453b4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFirstVehicleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  vehicleListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedVehicleItem: {
    borderColor: '#1453b4',
    backgroundColor: '#E7F3FF',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  vehicleSubtitle: {
    fontSize: 13,
    color: '#1453b4',
    fontWeight: '600',
    marginBottom: 4,
  },
  vehicleStatus: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
});
