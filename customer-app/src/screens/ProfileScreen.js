import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import api from '../config/api';

export default function ProfileScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        
        // Load saved profile image using user-specific key
        if (userObj._id) {
          const savedImage = await AsyncStorage.getItem(`profileImage_${userObj._id}`);
          if (savedImage) {
            setProfileImage(savedImage);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Gallery',
          onPress: () => pickImage('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (source) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change profile picture.');
        return;
      }

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // Save to AsyncStorage with user-specific key
        if (user?._id) {
          await AsyncStorage.setItem(`profileImage_${user._id}`, imageUri);
        }

        // Upload to database
        try {
          const formData = new FormData();
          formData.append('profileImage', {
            uri: imageUri,
            type: 'image/jpeg',
            name: `profile_${user?._id}.jpg`,
          });

          await api.put('/users/profile', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (uploadError) {
          console.error('Error uploading profile image:', uploadError);
          Alert.alert('Warning', 'Image saved locally but failed to upload to server. It will sync when connection is available.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleEditPhone = () => {
    setPhoneInput(user?.phone || '');
    setShowPhoneModal(true);
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (phoneInput.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsSavingPhone(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await api.put('/users/profile', 
        { phone: phoneInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = response.data.data;
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setShowPhoneModal(false);
      Alert.alert('Success', 'Phone number updated successfully!');
    } catch (error) {
      console.error('Error saving phone:', error);
      Alert.alert('Error', 'Failed to save phone number. Please try again.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use the logout function from AuthContext
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1453b4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Card with Avatar */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Main Menu Items */}
        <View style={styles.menuContainer}>
          {/* Subscription */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Subscriptions')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="repeat" size={24} color="#1453b4" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>My Subscription</Text>
                <Text style={styles.menuItemSubtitle}>View your active plans</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={24} color="#1453b4" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Email</Text>
                <Text style={styles.menuItemSubtitle}>{user?.email || 'N/A'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          {/* Mobile */}
          <TouchableOpacity style={styles.menuItem} onPress={handleEditPhone}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={24} color="#1453b4" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Mobile</Text>
                <Text style={[styles.menuItemSubtitle, !user?.phone && styles.naText]}>
                  {user?.phone || 'N/A - Tap to add'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          {/* Address */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('SavedAddresses')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={24} color="#1453b4" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Address</Text>
                <Text style={styles.menuItemSubtitle}>
                  {user?.address?.street ? 
                    `${user.address.city || 'Other'} - ${user.address.street.substring(0, 20)}...` : 
                    'Add/Change Address'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          {/* Vehicle */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('VehicleSelection', { fromProfile: true })}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="car-sport-outline" size={24} color="#1453b4" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Vehicle</Text>
                <Text style={styles.menuItemSubtitle}>
                  {user?.vehicle?.brand && user?.vehicle?.model ? 
                    `${user.vehicle.brand} ${user.vehicle.model}` : 
                    'Add/Change Vehicle'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>


          {/* Coins/Rewards */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="gift-outline" size={24} color="#FFD700" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>0</Text>
                <Text style={styles.menuItemSubtitle}>Coins</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('Chat')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#1453b4" />
              </View>
              <Text style={styles.menuItemTitle}>Chat Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('Notifications')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={24} color="#1453b4" />
              </View>
              <Text style={styles.menuItemTitle}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('PaymentMethods')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="card-outline" size={24} color="#1453b4" />
              </View>
              <Text style={styles.menuItemTitle}>Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('HelpSupport')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="help-circle-outline" size={24} color="#1453b4" />
              </View>
              <Text style={styles.menuItemTitle}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.getParent()?.navigate('TermsPrivacy')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={24} color="#1453b4" />
              </View>
              <Text style={styles.menuItemTitle}>Terms & Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#dc3545" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      <Modal
        visible={showPhoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.phoneModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {user?.phone ? 'Edit Phone Number' : 'Add Phone Number'}
              </Text>
              <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <Text style={styles.phoneModalSubtitle}>
              Your phone number is required for service coordination and updates.
            </Text>

            {phoneInput.length > 0 && (
              <View style={styles.phonePreviewContainer}>
                <Text style={styles.phonePreviewLabel}>Phone Number:</Text>
                <Text style={styles.phonePreviewText}>
                  {phoneInput.length >= 10 
                    ? `${phoneInput.slice(0, 5)} ${phoneInput.slice(5, 10)}`
                    : phoneInput}
                </Text>
                {phoneInput.length === 10 && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.checkIcon} />
                )}
              </View>
            )}

            <TextInput
              style={styles.phoneInput}
              placeholder="Enter 10-digit phone number"
              placeholderTextColor="#9CA3AF"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.savePhoneButton, isSavingPhone && styles.buttonDisabled]}
              onPress={handleSavePhone}
              disabled={isSavingPhone}
            >
              {isSavingPhone ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.savePhoneButtonText}>Save Phone Number</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1453b4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1453b4',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 15,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
    marginLeft: 10,
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  naText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalBackdropTouchable: {
    flex: 1,
    justifyContent: 'center',
  },
  phoneModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  phoneModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  phonePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  phonePreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  phonePreviewText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1453b4',
    letterSpacing: 1,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  phoneInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
  },
  savePhoneButton: {
    backgroundColor: '#1453b4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePhoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
