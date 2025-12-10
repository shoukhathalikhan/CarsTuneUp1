import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StarRating = ({ rating, onRatingChange, size = 30, disabled = false }) => {
  const renderStar = (starNumber) => {
    const filled = starNumber <= rating;
    const iconName = filled ? 'star' : 'star-outline';
    const color = filled ? '#FFD700' : '#D1D5DB';

    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => !disabled && onRatingChange(starNumber)}
        disabled={disabled}
        style={styles.starButton}
      >
        <Ionicons
          name={iconName}
          size={size}
          color={color}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(renderStar)}
      </View>
      <Text style={styles.ratingText}>
        {rating > 0 ? `${rating}.0` : 'Tap to rate'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default StarRating;
