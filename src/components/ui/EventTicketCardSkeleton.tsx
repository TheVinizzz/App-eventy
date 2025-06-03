import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme';

interface EventTicketCardSkeletonProps {
  style?: any;
}

export const EventTicketCardSkeleton: React.FC<EventTicketCardSkeletonProps> = ({ style }) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const SkeletonBox: React.FC<{ width: number | string; height: number; style?: any }> = ({ 
    width, 
    height, 
    style: boxStyle 
  }) => (
    <View style={[styles.skeletonBox, { width, height }, boxStyle]}>
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
            'rgba(255, 255, 255, 0.0)',
            'rgba(255, 255, 255, 0.08)',
            'rgba(255, 255, 255, 0.0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );

  const StatusBadgeSkeleton = () => (
    <View style={styles.statusBadgeContainer}>
      <SkeletonBox width={80} height={24} style={styles.statusBadgeSkeleton} />
    </View>
  );

  const ClickIndicatorSkeleton = () => (
    <View style={styles.clickIndicatorContainer}>
      <SkeletonBox width={32} height={32} style={styles.clickIndicatorSkeleton} />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        {/* Image Container Skeleton - Exact match with real card */}
        <View style={styles.imageContainer}>
          <SkeletonBox width="100%" height={110} style={styles.imageSkeleton} />
          <StatusBadgeSkeleton />
          <ClickIndicatorSkeleton />
        </View>

        {/* Content Skeleton - Exact match with real card structure */}
        <View style={styles.content}>
          {/* Title - matches eventTitle styling */}
          <SkeletonBox width="85%" height={16} style={styles.titleSkeleton} />
          
          {/* Location Row - matches eventLocationRow structure */}
          <View style={styles.locationRow}>
            <View style={styles.locationIconContainer}>
              <SkeletonBox width={18} height={18} style={styles.locationIconSkeleton} />
            </View>
            <SkeletonBox width="60%" height={12} style={styles.locationTextSkeleton} />
          </View>

          {/* Footer - matches eventCardFooter structure */}
          <View style={styles.footer}>
            <View style={styles.ticketInfo}>
              <SkeletonBox width="50%" height={10} style={styles.ticketCountSkeleton} />
              <SkeletonBox width="35%" height={14} style={styles.priceSkeleton} />
            </View>
            
            {/* Tap Indicator Skeleton - matches tapIndicator */}
            <View style={styles.tapIndicatorContainer}>
              <SkeletonBox width={90} height={20} style={styles.tapIndicatorSkeleton} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    height: 180,
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    height: 110,
    width: '100%',
  },
  imageSkeleton: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  statusBadgeSkeleton: {
    borderRadius: borderRadius.full,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  titleSkeleton: {
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  locationIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconSkeleton: {
    borderRadius: 7,
  },
  locationTextSkeleton: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketCountSkeleton: {
    marginBottom: spacing.xs,
  },
  priceSkeleton: {
    // No extra styling needed
  },
  skeletonBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 300,
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
  },
  clickIndicatorContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  clickIndicatorSkeleton: {
    borderRadius: 16,
  },
  tapIndicatorContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  tapIndicatorSkeleton: {
    borderRadius: 8,
  },
}); 