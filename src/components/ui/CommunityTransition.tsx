import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { EventCommunity } from '../../services/eventCommunityService';

const { width, height } = Dimensions.get('window');

interface CommunityTransitionProps {
  visible: boolean;
  community: EventCommunity | null;
  onComplete: () => void;
  loadingProgress: number;
}

const CommunityTransition: React.FC<CommunityTransitionProps> = ({
  visible,
  community,
  onComplete,
  loadingProgress,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 30,
          useNativeDriver: true,
        }),
      ]).start();

      const floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      floatAnimation.start();

      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();

      return () => {
        floatAnimation.stop();
        shimmerAnimation.stop();
      };
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: loadingProgress,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (loadingProgress >= 1) {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -height,
            duration: 400,
            easing: Easing.in(Easing.bezier(0.55, 0.06, 0.68, 0.19)),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete();
        });
      }, 600);
    }
  }, [loadingProgress]);

  if (!visible || !community) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[
          colors.brand.background,
          'rgba(18, 18, 18, 0.98)',
          colors.brand.background,
        ]}
        style={styles.background}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.heroSection,
            {
              transform: [
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.imageContainer}>
            <View style={styles.imageGlow} />
            <View style={styles.imageGlowSecondary} />
            
            {community.event.imageUrl ? (
              <Image
                source={{ uri: community.event.imageUrl }}
                style={styles.eventImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="calendar" size={28} color={colors.brand.primary} />
              </View>
            )}
            
            <Animated.View
              style={[
                styles.animatedRing,
                {
                  transform: [
                    {
                      scale: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.08],
                      }),
                    },
                  ],
                  opacity: progressAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.4, 0.8, 0.1],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {community.event.title}
            </Text>
            <View style={styles.eventMeta}>
              <Ionicons name="location" size={12} color={colors.brand.secondary} />
              <Text style={styles.eventLocation} numberOfLines={1}>
                {community.event.venue?.name}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.loadingSection}>
          <Animated.View
            style={[
              styles.statusContainer,
              { opacity: fadeAnim },
            ]}
          >
            <Text style={styles.statusText}>
              {loadingProgress < 0.3
                ? 'Conectando à comunidade...'
                : loadingProgress < 0.7
                ? 'Carregando conteúdo...'
                : loadingProgress < 1
                ? 'Finalizando...'
                : 'Pronto!'}
            </Text>
          </Animated.View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
              
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [
                      {
                        translateX: shimmerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-80, width * 0.8 + 80],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
            
            <Animated.View style={styles.progressPercentage}>
              <Text style={styles.progressText}>
                {Math.round(loadingProgress * 100)}%
              </Text>
            </Animated.View>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Preparando conteúdo</Text>
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((item, index) => (
                <Animated.View
                  key={item}
                  style={[
                    styles.skeletonItem,
                    {
                      opacity: progressAnim.interpolate({
                        inputRange: [0, (index + 1) * 0.25, 1],
                        outputRange: [0.2, 1, 1],
                      }),
                      transform: [
                        {
                          scale: progressAnim.interpolate({
                            inputRange: [0, (index + 1) * 0.25, 1],
                            outputRange: [0.96, 1, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.skeletonAvatar} />
                  <View style={styles.skeletonContent}>
                    <View style={styles.skeletonLine} />
                    <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
                  </View>
                  <View style={styles.skeletonAction} />
                  
                  <Animated.View
                    style={[
                      styles.skeletonShimmer,
                      {
                        transform: [
                          {
                            translateX: shimmerAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-40, 240],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </Animated.View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.premiumBadge}>
          <LinearGradient
            colors={[colors.brand.primary, colors.brand.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badgeGradient}
          >
            <Ionicons name="star" size={14} color={colors.brand.background} />
            <Text style={styles.badgeText}>PREMIUM</Text>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brand.primary,
    opacity: 0.15,
    transform: [{ scale: 1.4 }],
  },
  imageGlowSecondary: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.secondary,
    opacity: 0.1,
    transform: [{ scale: 1.6 }],
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.card,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    opacity: 0.6,
  },
  eventDetails: {
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  eventTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: typography.fontSizes.lg * 1.2,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.opacity.cardBorder,
    borderRadius: borderRadius.sm,
  },
  eventLocation: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.secondary,
    fontWeight: typography.fontWeights.medium,
  },
  loadingSection: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  statusContainer: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  statusText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.opacity.cardBorder,
    borderRadius: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: 1,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: 80,
    height: '100%',
    backgroundColor: colors.brand.secondary,
    opacity: 0.4,
    borderRadius: 1,
  },
  progressPercentage: {
    alignSelf: 'flex-end',
  },
  progressText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.bold,
  },
  previewSection: {
    width: '100%',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textTertiary,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skeletonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.opacity.cardBorder,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    opacity: 0.1,
    marginRight: spacing.md,
  },
  skeletonContent: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  skeletonLine: {
    height: 8,
    backgroundColor: colors.brand.primary,
    opacity: 0.1,
    borderRadius: 4,
  },
  skeletonLineShort: {
    width: '65%',
    height: 6,
  },
  skeletonAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    opacity: 0.1,
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: '100%',
    backgroundColor: colors.brand.primary,
    opacity: 0.08,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs / 2,
  },
  badgeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.background,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
});

export default CommunityTransition; 