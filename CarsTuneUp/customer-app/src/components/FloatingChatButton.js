import React, { useMemo, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FloatingChatButton({ onPress, hidden }) {
  if (hidden) return null;

  const { width: screenW, height: screenH } = Dimensions.get('window');
  const size = 56;
  const margin = 16;

  const pos = useRef(
    new Animated.ValueXY({
      x: screenW - size - margin,
      y: screenH - size - 120,
    })
  ).current;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const snapToEdge = (x, y) => {
    const minX = margin;
    const maxX = screenW - size - margin;
    const minY = margin + 40;
    const maxY = screenH - size - 90;

    const nextY = clamp(y, minY, maxY);
    const snapLeft = x < screenW / 2;
    const nextX = snapLeft ? minX : maxX;

    Animated.spring(pos, {
      toValue: { x: nextX, y: nextY },
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
        onPanResponderGrant: () => {
          pos.setOffset({ x: pos.x._value, y: pos.y._value });
          pos.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_evt, gestureState) => {
          pos.flattenOffset();

          const nextX = pos.x._value;
          const nextY = pos.y._value;
          snapToEdge(nextX, nextY);
        },
      }),
    [onPress, pos, screenH, screenW]
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pos.x }, { translateY: pos.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={0.9} style={styles.fab} onPress={onPress}>
        <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1453b4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
