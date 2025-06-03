import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme';

interface SearchEventCardSkeletonProps {
  style?: any;
}

export const SearchEventCardSkeleton: React.FC<SearchEventCardSkeletonProps> = ({ style }) => {
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
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        {/* Image Skeleton */}
        <SkeletonBox width="100%" height={120} style={styles.imageSkeleton} />

        {/* Content Skeleton */}
        <View style={styles.content}>
          {/* Title and Price Row */}
          <View style={styles.titleRow}>
            <SkeletonBox width="60%" height={16} />
            <SkeletonBox width="25%" height={16} />
          </View>
          
          {/* Location and Stats Row */}
          <View style={styles.infoRow}>
            <SkeletonBox width="45%" height={12} />
            <View style={styles.statsContainer}>
              <SkeletonBox width={30} height={12} />
              <SkeletonBox width={30} height={12} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  imageSkeleton: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  content: {
    padding: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  skeletonBox: {
    backgroundColor: colors.brand.card,
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
}); 