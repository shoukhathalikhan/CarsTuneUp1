import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const resolveExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest?.hostUri;

  if (!hostUri) {
    return null;
  }

  const [host] = hostUri.split(':');
  if (!host || host === 'localhost') {
    return null;
  }

  return host;
};

const sanitizeUrl = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
};

// Determine API URL based on platform
const getApiUrl = () => {
  const envUrl =
    sanitizeUrl(process?.env?.EXPO_PUBLIC_API_URL) ||
    sanitizeUrl(Constants.expoConfig?.extra?.apiUrl) ||
    sanitizeUrl(Constants.manifest?.extra?.apiUrl);

  if (envUrl) {
    return envUrl;
  }

  const derivedHost = resolveExpoHost();
  if (derivedHost) {
    return `http://${derivedHost}:5000/api`;
  }

  if (Platform.OS === 'android') {
    // Android emulator special alias
    return 'http://10.0.2.2:5000/api';
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin.replace(/\/?$/, '')}/api`;
  }

  return 'http://localhost:5000/api'; // iOS simulator fallback
};

const API_URL = getApiUrl();

// Log API configuration for debugging
console.log('🔧 API Configuration:', {
  platform: Platform.OS,
  apiUrl: API_URL,
  timeout: 30000,
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
  withCredentials: false, // Disable credentials for CORS
});

const getRequestUrl = (config) => {
  const base = typeof config.baseURL === 'string' ? config.baseURL : '';
  const url = typeof config.url === 'string' ? config.url : '';
  return `${base}${url}`;
};

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests for debugging
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: getRequestUrl(config),
      hasAuth: !!token,
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
    });
    return response;
  },
  async (error) => {
    // Log detailed error information
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config ? getRequestUrl(error.config) : undefined,
      method: error.config?.method?.toUpperCase(),
      data: error.response?.data,
    });
    
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // Navigate to login screen
    }
    
    // Enhanced error handling for network issues
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please check your internet connection.';
      } else if (error.message === 'Network Error') {
        error.message = 'Cannot connect to server. Please ensure:\n1. Backend server is running\n2. You are connected to the internet\n3. API URL is correct';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
