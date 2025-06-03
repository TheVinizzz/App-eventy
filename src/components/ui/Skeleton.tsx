import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: borderRadiusValue = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius: borderRadiusValue,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity,
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.3)',
            'rgba(255, 255, 255, 0.1)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

interface EventCardSkeletonProps {
  width?: number;
  height?: number;
}

export const EventCardSkeleton: React.FC<EventCardSkeletonProps> = ({
  width = screenWidth * 0.8,
  height = 280,
}) => {
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
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.8, width * 0.8],
  });

  const SkeletonBox: React.FC<{ 
    width: number | string; 
    height: number; 
    borderRadius?: number;
    style?: any;
  }> = React.memo(({ 
    width: boxWidth, 
    height: boxHeight, 
    borderRadius: boxBorderRadius = 4,
    style: boxStyle 
  }) => (
    <View style={[
      {
        width: boxWidth,
        height: boxHeight,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: boxBorderRadius,
        overflow: 'hidden',
        position: 'relative',
      },
      boxStyle
    ]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: typeof width === 'number' ? width * 1.2 : width,
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.0)',
            'rgba(255, 255, 255, 0.12)',
            'rgba(255, 255, 255, 0.0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            width: '100%',
          }}
        />
      </Animated.View>
    </View>
  ));

  return (
    <View style={[styles.featuredEventCardSkeleton, { width, height }]}>
      {/* Image Section - Exact match with real card */}
      <View style={styles.featuredImageSection}>
        <SkeletonBox 
          width="100%"
          height={160}
          borderRadius={0}
          style={styles.featuredImageSkeleton}
        />
        
        {/* Premium Badge Skeleton - Top Left */}
        <View style={styles.featuredPremiumBadgeSkeleton}>
          <SkeletonBox width={70} height={24} borderRadius={12} />
        </View>
        
        {/* Activity Badge Skeleton - Top Right */}
        <View style={styles.featuredActivityBadgeSkeleton}>
          <SkeletonBox width={60} height={24} borderRadius={12} />
        </View>
        
        {/* Date Badge Skeleton - Bottom Left */}
        <View style={styles.featuredDateBadgeSkeleton}>
          <SkeletonBox width={80} height={48} borderRadius={8} />
        </View>
      </View>
      
      {/* Content Section - Exact match with real card */}
      <View style={styles.featuredContentSection}>
        {/* Title - Two lines exactly like real card */}
        <View style={styles.featuredTitleSection}>
          <SkeletonBox 
            width="90%"
            height={18}
            borderRadius={6}
            style={styles.featuredTitleLine1}
          />
          <SkeletonBox 
            width="70%"
            height={18}
            borderRadius={6}
            style={styles.featuredTitleLine2}
          />
        </View>
        
        {/* Location Row - Icon + Text */}
        <View style={styles.featuredLocationRow}>
          <SkeletonBox width={16} height={16} borderRadius={8} />
          <SkeletonBox width="65%" height={14} borderRadius={4} />
        </View>
        
        {/* Stats Row - People + Rating */}
        <View style={styles.featuredStatsRow}>
          <View style={styles.featuredStatItem}>
            <SkeletonBox width={14} height={14} borderRadius={7} />
            <SkeletonBox width={35} height={14} borderRadius={4} />
          </View>
          <View style={styles.featuredStatItem}>
            <SkeletonBox width={14} height={14} borderRadius={7} />
            <SkeletonBox width={30} height={14} borderRadius={4} />
          </View>
        </View>
        
        {/* Price Section - Label + Value + Button */}
        <View style={styles.featuredPriceSection}>
          <View style={styles.featuredPriceInfo}>
            <SkeletonBox 
              width={80} 
              height={12} 
              borderRadius={4}
              style={styles.featuredPriceLabel}
            />
            <SkeletonBox 
              width={100} 
              height={20} 
              borderRadius={6}
              style={styles.featuredPriceValue}
            />
          </View>
          <SkeletonBox width={85} height={36} borderRadius={18} />
        </View>
      </View>
    </View>
  );
};

interface FeaturedEventsSkeletonProps {
  count?: number;
}

export const FeaturedEventsSkeleton: React.FC<FeaturedEventsSkeletonProps> = ({
  count = 3,
}) => {
  const cardWidth = screenWidth * 0.8;
  const cardHeight = 280;
  
  return (
    <View style={styles.featuredSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton 
          key={index}
          width={cardWidth}
          height={cardHeight}
        />
      ))}
    </View>
  );
};

export const NearbyEventsSkeleton: React.FC<{ count?: number }> = ({
  count = 3,
}) => {
  return (
    <View style={styles.nearbyEventsSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.nearbyEventSkeletonWrapper}>
          <View style={styles.nearbyEventCard}>
            {/* Image Container */}
            <View style={styles.nearbyEventImageContainer}>
              <Skeleton width={140} height={140} borderRadius={0} />
              {/* Price Badge */}
              <View style={styles.nearbyEventPriceBadgeSkeleton}>
                <Skeleton width={50} height={20} borderRadius={10} />
              </View>
            </View>
            
            {/* Content */}
            <View style={styles.nearbyEventContent}>
              {/* Header */}
              <View style={styles.nearbyEventHeader}>
                <View style={styles.nearbyEventTitleSkeleton}>
                  <Skeleton width="70%" height={16} borderRadius={4} style={styles.nearbyEventTitleLine1} />
                  <Skeleton width="50%" height={16} borderRadius={4} style={styles.nearbyEventTitleLine2} />
                </View>
                <View style={styles.nearbyEventAttendeesSkeleton}>
                  <Skeleton width={16} height={16} borderRadius={8} />
                  <Skeleton width={25} height={12} borderRadius={4} />
                </View>
              </View>
              
              {/* Location */}
              <View style={styles.nearbyEventLocation}>
                <Skeleton width={14} height={14} borderRadius={7} />
                <Skeleton width="60%" height={14} borderRadius={4} />
              </View>
              
              {/* Date and Time */}
              <View style={styles.nearbyEventMeta}>
                <View style={styles.nearbyEventDateSkeleton}>
                  <Skeleton width={16} height={16} borderRadius={8} />
                  <Skeleton width={80} height={12} borderRadius={4} />
                </View>
              </View>
              
              {/* Time Row */}
              <View style={styles.nearbyEventTimeRow}>
                <View style={styles.nearbyEventTimeSkeleton}>
                  <Skeleton width={16} height={16} borderRadius={8} />
                  <Skeleton width={40} height={12} borderRadius={4} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brand.darkGray,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  
  // Event Card Skeleton
  eventCardSkeleton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    marginRight: spacing.lg,
    overflow: 'hidden',
  },
  imageSkeletonContainer: {
    position: 'relative',
  },
  imageSkeleton: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  premiumBadgeSkeleton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  activityBadgeSkeleton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  dateBadgeSkeleton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  contentSkeleton: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  titleSection: {
    marginBottom: spacing.md,
  },
  titleLine1: {
    marginBottom: spacing.xs,
  },
  titleLine2: {
    marginBottom: 0,
  },
  locationSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statsSkeleton: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priceSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    marginTop: spacing.xs,
  },
  priceValue: {
    marginTop: spacing.xs,
  },
  
  // Featured Events Skeleton
  featuredSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  
  // Nearby Events Skeleton
  nearbyEventsSkeleton: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  nearbyEventSkeletonWrapper: {
    marginBottom: spacing.md,
  },
  nearbyEventCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    height: 140,
  },
  nearbyEventContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    height: '100%',
  },
  nearbyEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  nearbyEventImageContainer: {
    position: 'relative',
    width: 140,
    height: '100%',
  },
  nearbyEventPriceBadgeSkeleton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  nearbyEventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  nearbyEventMeta: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  nearbyEventDateSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  nearbyEventTimeSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  nearbyEventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nearbyEventAttendeesSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  nearbyEventTitleSkeleton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nearbyEventTitleLine1: {
    marginBottom: spacing.xs,
  },
  nearbyEventTitleLine2: {
    marginBottom: 0,
  },
  featuredEventCardSkeleton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    marginRight: spacing.lg,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  featuredImageSection: {
    position: 'relative',
  },
  featuredImageSkeleton: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  featuredPremiumBadgeSkeleton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  featuredActivityBadgeSkeleton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  featuredDateBadgeSkeleton: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
  },
  featuredContentSection: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  featuredTitleSection: {
    marginBottom: spacing.md,
  },
  featuredTitleLine1: {
    marginBottom: spacing.xs,
  },
  featuredTitleLine2: {
    marginBottom: 0,
  },
  featuredLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  featuredStatsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  featuredStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featuredPriceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  featuredPriceInfo: {
    flex: 1,
  },
  featuredPriceLabel: {
    marginTop: spacing.xs,
  },
  featuredPriceValue: {
    marginTop: spacing.xs,
  },
});

export default Skeleton; 