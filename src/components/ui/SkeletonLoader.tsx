import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

// Basic Skeleton Component
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.1)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton for Stats Cards
export const StatsCardSkeleton: React.FC = () => {
  return (
    <View style={styles.statsCardSkeleton}>
      <View style={styles.statsIconSkeleton}>
        <SkeletonLoader width={20} height={20} borderRadius={10} />
      </View>
      <SkeletonLoader width={60} height={18} style={{ marginBottom: 4 }} />
      <SkeletonLoader width={80} height={12} />
    </View>
  );
};

// Skeleton for Event Cards
export const EventCardSkeleton: React.FC = () => {
  return (
    <View style={styles.eventCardSkeleton}>
      {/* Image Skeleton */}
      <View style={styles.eventImageSkeleton}>
        <SkeletonLoader width="100%" height={120} borderRadius={0} />
        
        {/* Status Badge Skeleton */}
        <View style={styles.statusBadgeSkeleton}>
          <SkeletonLoader width={60} height={20} borderRadius={8} />
        </View>

        {/* Date Badge Skeleton */}
        <View style={styles.dateBadgeSkeleton}>
          <SkeletonLoader width={36} height={36} borderRadius={8} />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.eventContentSkeleton}>
        {/* Title and Time */}
        <View style={styles.eventHeaderSkeleton}>
          <View style={styles.eventTitleSkeleton}>
            <SkeletonLoader width="90%" height={16} style={{ marginBottom: 4 }} />
            <SkeletonLoader width="70%" height={16} />
          </View>
          <SkeletonLoader width={50} height={24} borderRadius={6} />
        </View>

        {/* Location */}
        <View style={styles.eventLocationSkeleton}>
          <SkeletonLoader width={12} height={12} borderRadius={6} />
          <SkeletonLoader width="80%" height={13} />
        </View>

        {/* Metrics */}
        <View style={styles.eventMetricsSkeleton}>
          <View style={styles.metricSkeleton}>
            <SkeletonLoader width={12} height={12} borderRadius={6} />
            <SkeletonLoader width={30} height={11} />
            <SkeletonLoader width={40} height={10} />
          </View>
          <View style={styles.metricSkeleton}>
            <SkeletonLoader width={12} height={12} borderRadius={6} />
            <SkeletonLoader width={25} height={11} />
            <SkeletonLoader width={35} height={10} />
          </View>
          <View style={styles.metricSkeleton}>
            <SkeletonLoader width={12} height={12} borderRadius={6} />
            <SkeletonLoader width={40} height={11} />
            <SkeletonLoader width={30} height={10} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Skeleton for Header Stats Section
export const HeaderStatsSkeleton: React.FC = () => {
  return (
    <View style={styles.headerStatsSkeleton}>
      {/* Title */}
      <View style={styles.statsTitleSkeleton}>
        <SkeletonLoader width={20} height={20} borderRadius={10} />
        <SkeletonLoader width={120} height={20} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGridSkeleton}>
        <View style={styles.statsRowSkeleton}>
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </View>
        <View style={styles.statsRowSkeleton}>
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </View>
      </View>
    </View>
  );
};

// Skeleton for Tabs
export const TabsSkeleton: React.FC = () => {
  return (
    <View style={styles.tabsSkeleton}>
      <SkeletonLoader width={80} height={36} borderRadius={20} />
      <SkeletonLoader width={90} height={36} borderRadius={20} />
      <SkeletonLoader width={85} height={36} borderRadius={20} />
    </View>
  );
};

// Complete Loading State for MyEventsScreen
export const MyEventsLoadingSkeleton: React.FC = () => {
  return (
    <View style={styles.fullLoadingSkeleton}>
      {/* Header Stats */}
      <HeaderStatsSkeleton />
      
      {/* Tabs */}
      <TabsSkeleton />
      
      {/* Events List */}
      <View style={styles.eventsListSkeleton}>
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.brand.darkGray,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
    width: 200,
  },

  // Stats Card Skeleton
  statsCardSkeleton: {
    flex: 1,
    backgroundColor: colors.brand.darkGray,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
    minHeight: 90,
    justifyContent: 'center',
  },
  statsIconSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  // Event Card Skeleton
  eventCardSkeleton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
    marginBottom: 16,
  },
  eventImageSkeleton: {
    position: 'relative',
    height: 120,
  },
  statusBadgeSkeleton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  dateBadgeSkeleton: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  eventContentSkeleton: {
    padding: 16,
  },
  eventHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitleSkeleton: {
    flex: 1,
    marginRight: 8,
  },
  eventLocationSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  eventMetricsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },

  // Header Stats Skeleton
  headerStatsSkeleton: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsTitleSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statsGridSkeleton: {
    gap: 12,
  },
  statsRowSkeleton: {
    flexDirection: 'row',
    gap: 12,
  },

  // Tabs Skeleton
  tabsSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },

  // Full Loading Skeleton
  fullLoadingSkeleton: {
    flex: 1,
  },
  eventsListSkeleton: {
    paddingHorizontal: 20,
  },
});

export default SkeletonLoader; 