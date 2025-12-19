import React from 'react';
import { SafeAreaView, View, StyleSheet, Platform, StatusBar } from 'react-native';
import { getStatusBarHeight, getBottomSpace } from '../utils/responsive';

const SafeAreaWrapper = ({ children, style, edges = ['top', 'bottom'], backgroundColor = '#FFFFFF' }) => {
  const safeAreaStyle = {
    paddingTop: edges.includes('top') ? getStatusBarHeight() : 0,
    paddingBottom: edges.includes('bottom') ? getBottomSpace() : 0,
    backgroundColor,
  };

  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView style={[styles.container, safeAreaStyle, style]}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, safeAreaStyle, style]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
