import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get FCM token
 */
export async function registerForPushNotificationsAsync() {
  try {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007BFF',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      // Get the FCM token - handle Expo Go limitation
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('📱 FCM Token:', token);
      } catch (error) {
        console.log('⚠️ Push notifications not available in Expo Go for SDK 53+. Use development build for full functionality.');
        return;
      }
    
    // Save token to backend
    try {
      await api.post('/users/fcm-token', { fcmToken: token });
      await AsyncStorage.setItem('fcmToken', token);
      console.log('✅ FCM token saved to backend');
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  } catch (error) {
    console.error('❌ Error in registerForPushNotificationsAsync:', error);
    return null;
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(navigation) {
  // Handle notification received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 Notification received:', notification);
  });

  // Handle notification response (user tapped on notification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data.type === 'upcoming_wash' && data.subscriptionId) {
      navigation.navigate('Subscriptions');
    } else if (data.type === 'job_completed' && data.jobId) {
      navigation.navigate('History');
    }
  });

  // Return cleanup function
  return () => {
    if (notificationListener && notificationListener.remove) {
      notificationListener.remove();
    }
    if (responseListener && responseListener.remove) {
      responseListener.remove();
    }
  };
}

/**
 * Send a local notification (for testing)
 */
export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount() {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}
