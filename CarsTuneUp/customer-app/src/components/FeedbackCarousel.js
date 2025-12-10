import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FeedbackCard from './FeedbackCard';
import api from '../config/api';

const { width: screenWidth } = Dimensions.get('window');

const FeedbackCarousel = ({ refreshTrigger }) => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const autoScrollInterval = useRef(null);

  useEffect(() => {
    fetchTopFeedback();
  }, [refreshTrigger]);

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [feedback.length]);

  const fetchTopFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get('/feedback/top');
      if (response.data.status === 'success') {
        setFeedback(response.data.data.feedback || []);
      }
    } catch (error) {
      console.error('Fetch top feedback error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAutoScroll = () => {
    if (feedback.length <= 1) return;
    
    stopAutoScroll();
    autoScrollInterval.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % feedback.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 4000); // Auto-scroll every 4 seconds
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  };

  const scrollToIndex = (index) => {
    if (scrollViewRef.current) {
      const scrollX = index * (280 + 16); // card width + margin
      scrollViewRef.current.scrollTo({
        x: scrollX,
        y: 0,
        animated: true,
      });
    }
  };

  const handleManualScroll = (event) => {
    stopAutoScroll();
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (280 + 16));
    setCurrentIndex(index);
    
    // Restart auto-scroll after 3 seconds of inactivity
    setTimeout(() => {
      startAutoScroll();
    }, 3000);
  };

  const goToPrevious = () => {
    stopAutoScroll();
    const prevIndex = currentIndex === 0 ? feedback.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    scrollToIndex(prevIndex);
    setTimeout(() => startAutoScroll(), 3000);
  };

  const goToNext = () => {
    stopAutoScroll();
    const nextIndex = (currentIndex + 1) % feedback.length;
    setCurrentIndex(nextIndex);
    scrollToIndex(nextIndex);
    setTimeout(() => startAutoScroll(), 3000);
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {feedback.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              stopAutoScroll();
              setCurrentIndex(index);
              scrollToIndex(index);
              setTimeout(() => startAutoScroll(), 3000);
            }}
          >
            <View
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#1453b4" />
        <Text style={styles.loadingText}>Loading feedback...</Text>
      </View>
    );
  }

  if (feedback.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={40} color="#9CA3AF" />
        <Text style={styles.emptyText}>No feedback yet</Text>
        <Text style={styles.emptySubtext}>Be the first to share your experience!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What Our Customers Say</Text>
      
      {/* Navigation Arrows */}
      {feedback.length > 1 && (
        <>
          <TouchableOpacity style={styles.navButtonLeft} onPress={goToPrevious}>
            <Ionicons name="chevron-back" size={20} color="#1453b4" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButtonRight} onPress={goToNext}>
            <Ionicons name="chevron-forward" size={20} color="#1453b4" />
          </TouchableOpacity>
        </>
      )}

      {/* Feedback Cards Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
        onMomentumScrollEnd={handleManualScroll}
        pagingEnabled={false}
        snapToInterval={280 + 16} // card width + margin
        snapToAlignment="center"
        decelerationRate="fast"
      >
        {feedback.map((item, index) => (
          <FeedbackCard key={index} feedback={item} />
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {feedback.length > 1 && renderPaginationDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  carousel: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  navButtonLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  navButtonRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    backgroundColor: '#1453b4',
    width: 24,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default FeedbackCarousel;
