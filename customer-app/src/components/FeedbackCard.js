import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import StarRating from './StarRating';

const FeedbackCard = ({ feedback }) => {
  // Generate a default avatar URL or use user's profile image if available
  const getAvatarSource = () => {
    if (feedback.userProfileImage) {
      return { uri: feedback.userProfileImage };
    }
    // Generate a colorful avatar based on user name
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD'];
    const colorIndex = feedback.userName ? feedback.userName.charCodeAt(0) % colors.length : 0;
    return null; // Will use colored circle
  };

  const getAvatarColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD'];
    return feedback.userName ? colors[feedback.userName.charCodeAt(0) % colors.length] : '#E5E7EB';
  };

  return (
    <View style={styles.card}>
      {/* User Profile Image */}
      <View style={[styles.avatarContainer, { backgroundColor: getAvatarColor() }]}>
        {getAvatarSource() ? (
          <Image source={getAvatarSource()} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>
            {feedback.userName ? feedback.userName.charAt(0).toUpperCase() : 'U'}
          </Text>
        )}
      </View>

      {/* User Name */}
      <Text style={styles.userName}>{feedback.userName || 'Anonymous User'}</Text>

      {/* Rating Stars */}
      <View style={styles.ratingContainer}>
        <StarRating rating={feedback.rating || 0} size={14} disabled={true} />
      </View>

      {/* Feedback Text */}
      <Text style={styles.feedbackText} numberOfLines={3}>
        {feedback.feedback || 'No feedback provided'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    width: 280,
    minHeight: 200,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FeedbackCard;
