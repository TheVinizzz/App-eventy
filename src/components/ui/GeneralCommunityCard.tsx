import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.42;
const CARD_HEIGHT = 180;

interface GeneralCommunityCardProps {
  onPress: () => void;
  memberCount?: number;
}

export const GeneralCommunityCard: React.FC<GeneralCommunityCardProps> = ({
  onPress,
  memberCount = 0,
}) => {
  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[
          'rgba(99, 102, 241, 0.2)',  // Azul claro
          'rgba(79, 70, 229, 0.4)',   // Azul médio
          'rgba(67, 56, 202, 0.8)'    // Azul escuro
        ]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        {/* Icon central */}
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="globe" size={32} color={colors.brand.textPrimary} />
          </View>
          
          <Text style={styles.title}>Comunidade{'\n'}Geral</Text>
          
          <View style={styles.memberBadge}>
            <Ionicons name="people" size={12} color={colors.brand.textPrimary} />
            <Text style={styles.memberText}>{formatMemberCount(memberCount)}</Text>
          </View>
        </View>

        {/* Bottom info */}
        <View style={styles.bottomInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="chatbubbles-outline" size={10} color={colors.brand.textSecondary} />
            <Text style={styles.infoText}>Feed Global</Text>
          </View>
          
          <View style={styles.enterButton}>
            <Ionicons name="arrow-forward" size={14} color={'#6366F1'} />
          </View>
        </View>

        {/* Decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </LinearGradient>

      {/* Glass overlay */}
      <View style={styles.glassOverlay} />
      
      {/* Border glow */}
      <View style={styles.borderGlow} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  gradient: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
    position: 'relative',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  memberText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  enterButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 30,
    left: 10,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.xl,
    pointerEvents: 'none',
  },
  borderGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: borderRadius.xl + 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    pointerEvents: 'none',
  },
}); 