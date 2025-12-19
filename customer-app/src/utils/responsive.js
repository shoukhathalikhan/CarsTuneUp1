import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const baseWidth = 375;
const baseHeight = 812;

// Store safe area insets - will be set by SafeAreaWrapper
let safeAreaInsets = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

// Function to update safe area insets from SafeAreaProvider
export const setSafeAreaInsets = (insets) => {
  safeAreaInsets = insets;
};

// Responsive width
export const wp = (percentage) => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(value);
};

// Responsive height
export const hp = (percentage) => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(value);
};

// Responsive font size
export const rfs = (size) => {
  const scale = SCREEN_WIDTH / baseWidth;
  const newSize = size * scale;
  return Math.round(newSize);
};

// Get status bar height - uses actual safe area insets
export const getStatusBarHeight = () => {
  // If we have actual insets, use them
  if (safeAreaInsets.top > 0) {
    return safeAreaInsets.top;
  }
  // Fallback for when insets aren't available yet
  if (Platform.OS === 'ios') {
    return SCREEN_HEIGHT >= 812 ? 44 : 20;
  }
  return StatusBar.currentHeight || 0;
};

// Get bottom safe area height - uses actual safe area insets
export const getBottomSpace = () => {
  // If we have actual insets, use them
  if (safeAreaInsets.bottom !== undefined && safeAreaInsets.bottom > 0) {
    return safeAreaInsets.bottom;
  }
  // For Android, always add minimum padding for buttons to be visible
  // This ensures buttons don't overlap even if insets aren't detected
  if (Platform.OS === 'android') {
    return 16; // Minimum padding for Android
  }
  // For iOS devices with home indicator
  if (Platform.OS === 'ios') {
    return SCREEN_HEIGHT >= 812 ? 34 : 0;
  }
  return 16; // Default minimum padding
};

// Check if device has notch
export const hasNotch = () => {
  if (Platform.OS === 'ios') {
    return SCREEN_HEIGHT >= 812;
  }
  return false;
};

// Responsive spacing
export const spacing = {
  xs: wp(1),
  sm: wp(2),
  md: wp(4),
  lg: wp(6),
  xl: wp(8),
  xxl: wp(10),
};

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Check if tablet
export const isTablet = () => {
  return SCREEN_WIDTH >= 768;
};

// Get header height based on device
export const getHeaderHeight = () => {
  const statusBarHeight = getStatusBarHeight();
  const headerBaseHeight = Platform.OS === 'ios' ? 44 : 56;
  return statusBarHeight + headerBaseHeight;
};
