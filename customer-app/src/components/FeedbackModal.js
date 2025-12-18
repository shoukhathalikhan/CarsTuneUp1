import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from './StarRating';
import api from '../config/api';

const FeedbackModal = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (feedback.trim().length === 0) {
      Alert.alert('Feedback Required', 'Please enter your feedback before submitting.');
      return;
    }

    if (countWords(feedback) > 50) {
      Alert.alert('Too Long', 'Please keep your feedback to 50 words or less.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/feedback', {
        rating,
        feedback: feedback.trim(),
      });

      if (response.data.status === 'success') {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                setRating(0);
                setFeedback('');
                onClose();
                if (onSubmit) onSubmit();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Submit feedback error:', error);
      Alert.alert(
        'Error',
        'Failed to submit feedback. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRating(0);
      setFeedback('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Your Feedback</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
            <Text style={styles.sectionSubtitle}>
              How would you rate our car wash service?
            </Text>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size={40}
              disabled={loading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tell Us More</Text>
            <Text style={styles.sectionSubtitle}>
              Share your experience (50 words max)
            </Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Brief feedback..."
              multiline
              numberOfLines={3}
              value={feedback}
              onChangeText={setFeedback}
              editable={!loading}
              maxLength={250}
            />
            <Text style={[
              styles.characterCount,
              countWords(feedback) > 50 && styles.characterCountWarning
            ]}>
              {countWords(feedback)}/50 words
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (rating === 0 || feedback.trim().length === 0 || loading) &&
                styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || feedback.trim().length === 0 || loading}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>Sending...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Send Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    maxHeight: '50%', // Half-screen height
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20, // Reduced from 32
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  characterCountWarning: {
    color: '#EF4444',
  },
  buttonContainer: {
    marginTop: 10, // Reduced spacing
  },
  submitButton: {
    backgroundColor: '#1453b4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeedbackModal;
