import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface ParallaxEventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    price: string;
    category: string;
    gradient: string[];
  };
  index: number;
  scrollX: Animated.Value;
  onPress?: () => void;
}

export const ParallaxEventCard: React.FC<ParallaxEventCardProps> = ({
  event,
  index,
  scrollX,
  onPress,
}) => {
  const cardWidth = screenWidth * 0.85;
  const inputRange = [
    (index - 1) * (cardWidth + spacing.md),
    index * (cardWidth + spacing.md),
    (index + 1) * (cardWidth + spacing.md),
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.6, 1, 0.6],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [20, 0, 20],
    extrapolate: 'clamp',
  });

  const rotateY = scrollX.interpolate({
    inputRange,
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [
            { scale },
            { translateY },
            { perspective: 1000 },
            { rotateY },
          ],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.touchable}
      >
        <View style={styles.card}>
          <LinearGradient
            colors={[event.gradient[0], event.gradient[1], 'rgba(0,0,0,0.4)']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Floating Elements */}
            <View style={styles.floatingElements}>
              <View style={[styles.floatingDot, styles.dot1]} />
              <View style={[styles.floatingDot, styles.dot2]} />
              <View style={[styles.floatingDot, styles.dot3]} />
            </View>

            {/* Card Header */}
            <View style={styles.header}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>
              <TouchableOpacity style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Card Content */}
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>
                {event.title}
              </Text>
              
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="calendar-outline" size={16} color="#fff" />
                  </View>
                  <Text style={styles.detailText}>
                    {new Date(event.date).toLocaleDateString('pt-BR')} • {event.time}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="location-outline" size={16} color="#fff" />
                  </View>
                  <Text style={styles.detailText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="pricetag-outline" size={16} color="#fff" />
                  </View>
                  <Text style={styles.priceText}>{event.price}</Text>
                </View>
              </View>
            </View>

            {/* Card Footer */}
            <View style={styles.footer}>
              <View style={styles.actionButton}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Ver Detalhes</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </View>
            </View>

            {/* Shine Effect */}
            <Animated.View style={styles.shineEffect} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: screenWidth * 0.85,
    height: 300,
    marginRight: spacing.md,
  },
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  gradient: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    position: 'relative',
  },
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingDot: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  dot1: {
    width: 8,
    height: 8,
    top: '20%',
    right: '15%',
  },
  dot2: {
    width: 12,
    height: 12,
    top: '60%',
    right: '25%',
  },
  dot3: {
    width: 6,
    height: 6,
    top: '40%',
    left: '20%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryText: {
    color: '#fff',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: '#fff',
    marginBottom: spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    lineHeight: typography.fontSizes.xxl * 1.2,
  },
  details: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  detailText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    flex: 1,
  },
  priceText: {
    color: '#fff',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    flex: 1,
  },
  footer: {
    alignItems: 'flex-end',
    zIndex: 2,
  },
  actionButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
}); 