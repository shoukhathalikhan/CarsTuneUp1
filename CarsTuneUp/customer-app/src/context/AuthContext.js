import React, { createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  // Logout function to be shared via context
  const logout = async () => {
    try {
      // Get user data to find user ID before clearing
      const userData = await AsyncStorage.getItem('userData');
      let userId = null;
      if (userData) {
        const userObj = JSON.parse(userData);
        userId = userObj._id;
      }
      
      // Clear user tokens and data
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      
      // Clear user-specific profile image if user ID exists
      if (userId) {
        await AsyncStorage.removeItem(`profileImage_${userId}`);
      }
      
      // Return success so the App component can handle state updates
      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      // Still return success even if cleanup fails
      return { success: true };
    }
  };

  const value = {
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
