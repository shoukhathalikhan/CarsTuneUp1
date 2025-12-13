import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppState, Platform } from 'react-native';
import { registerForPushNotificationsAsync, setupNotificationListeners } from './src/services/notificationService';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SubscriptionsScreen from './src/screens/SubscriptionsScreen';
import SubscriptionDetailScreen from './src/screens/SubscriptionDetailScreen';
import InsuranceScreen from './src/screens/InsuranceScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import VehicleSelectionScreen from './src/screens/VehicleSelectionScreen';
import AddressSelectionScreen from './src/screens/AddressSelectionScreen';
import SubscriptionBookingScreen from './src/screens/SubscriptionBookingScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import TermsPrivacyScreen from './src/screens/TermsPrivacyScreen';
import CarWashPlansScreen from './src/screens/CarWashPlansScreen';
import ChatScreen from './src/screens/ChatScreen';
import CartScreen from './src/screens/CartScreen';
import OrderReviewScreen from './src/screens/OrderReviewScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import LocationSelectionScreen from './src/screens/LocationSelectionScreen';
import LocationAdditionScreen from './src/screens/LocationAdditionScreen';
import api from './src/config/api';
import FloatingChatButton from './src/components/FloatingChatButton';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (Platform.OS === 'web') {
            // Use simple text for web to avoid font issues
            return null;
          }
          
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Subscriptions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Insurance') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1453b4',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <Tab.Screen name="Insurance" component={InsuranceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main App Component with auth logic
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigationRef = useRef();
  const [currentRouteName, setCurrentRouteName] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    checkLoginStatus();
    
    // Listen for app state changes to check login status
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkLoginStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Initialize push notifications when user is logged in
  useEffect(() => {
    if (isLoggedIn && navigationRef.current) {
      // Register for push notifications
      registerForPushNotificationsAsync();
      
      // Setup notification listeners
      const cleanup = setupNotificationListeners(navigationRef.current);
      
      return cleanup;
    }
  }, [isLoggedIn]);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token);
      
      if (token) {
        // Fetch user profile to check if vehicle and address are set
        try {
          const response = await api.get('/users/profile');
          setUserProfile(response.data.data.user);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
      setProfileLoading(false);
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
      setProfileLoading(false);
    }
  };

  // Enhanced logout function that updates state
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setIsLoggedIn(false);
      setUserProfile(null);
    }
  };

  // Show nothing while checking initial auth status
  if (isLoggedIn === null || (isLoggedIn && profileLoading)) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <CartProvider>
        <AppProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              try {
                const routeName = navigationRef.current?.getCurrentRoute?.()?.name;
                setCurrentRouteName(routeName || null);
              } catch (_e) {
                setCurrentRouteName(null);
              }
            }}
            onStateChange={() => {
              try {
                const routeName = navigationRef.current?.getCurrentRoute?.()?.name;
                setCurrentRouteName(routeName || null);
              } catch (_e) {
                setCurrentRouteName(null);
              }
            }}
          >
            <Stack.Navigator
              screenOptions={{ headerShown: false }}
            >
              {!isLoggedIn ? (
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Register" component={RegisterScreen} />
                  <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} />
                  <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
                  <Stack.Screen name="LocationAddition" component={LocationAdditionScreen} />
                  <Stack.Screen name="VehicleSelection" component={VehicleSelectionScreen} />
                  <Stack.Screen name="MainTabs" component={MainTabs} />
                  <Stack.Screen name="Services" component={ServicesScreen} />
                  <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
                  <Stack.Screen name="Cart" component={CartScreen} />
                  <Stack.Screen name="OrderReview" component={OrderReviewScreen} />
                  <Stack.Screen name="Payment" component={PaymentScreen} />
                  <Stack.Screen name="CarWashPlans" component={CarWashPlansScreen} />
                  <Stack.Screen name="SubscriptionBooking" component={SubscriptionBookingScreen} />
                  <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
                  <Stack.Screen name="Notifications" component={NotificationsScreen} />
                  <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
                  <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
                  <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                </>
              ) : (
                <>
                  <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} />
                  <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
                  <Stack.Screen name="LocationAddition" component={LocationAdditionScreen} />
                  <Stack.Screen name="VehicleSelection" component={VehicleSelectionScreen} />
                  <Stack.Screen name="MainTabs" component={MainTabs} />
                  <Stack.Screen name="Services" component={ServicesScreen} />
                  <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
                  <Stack.Screen name="Cart" component={CartScreen} />
                  <Stack.Screen name="OrderReview" component={OrderReviewScreen} />
                  <Stack.Screen name="Payment" component={PaymentScreen} />
                  <Stack.Screen name="CarWashPlans" component={CarWashPlansScreen} />
                  <Stack.Screen name="SubscriptionBooking" component={SubscriptionBookingScreen} />
                  <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
                  <Stack.Screen name="Notifications" component={NotificationsScreen} />
                  <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
                  <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
                  <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>

          {isLoggedIn && (
            <FloatingChatButton
              hidden={currentRouteName === 'Chat'}
              onPress={() => navigationRef.current?.navigate('Chat')}
            />
          )}
        </AppProvider>
      </CartProvider>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

