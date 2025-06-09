import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { EventCommunity } from '../../services/eventCommunityService';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.42; // 42% da largura da tela
const CARD_HEIGHT = 180;

interface EventCommunityMiniCardProps {
  community: EventCommunity;
  onPress: (community: EventCommunity) => void;
  isJoining?: boolean;
  variant?: 'event' | 'general'; // Novo: tipo de comunidade
}

export const EventCommunityMiniCard: React.FC<EventCommunityMiniCardProps> = ({
  community,
  onPress,
  isJoining = false,
  variant = 'event',
}) => {
  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('pt-BR', { month: 'short' });
    return `${day} ${month}`;
  };

  // Cores e estilos baseados no tipo
  const getCardStyles = () => {
    if (variant === 'event') {
      return {
        borderGlow: 'rgba(255, 215, 0, 0.4)', // Dourado para eventos
        gradient: [
          'rgba(255, 193, 7, 0.1)',   // Amarelo/dourado claro
          'rgba(255, 152, 0, 0.2)',   // Laranja médio
          'rgba(0, 0, 0, 0.8)'        // Preto para legibilidade
        ] as const,
        badgeColor: '#FFD700', // Dourado
        iconColor: '#FFD700',
        shadowColor: '#FFD700',
      };
    } else {
      return {
        borderGlow: 'rgba(99, 102, 241, 0.4)', // Azul para geral
        gradient: [
          'rgba(99, 102, 241, 0.1)',  // Azul claro
          'rgba(79, 70, 229, 0.2)',   // Azul médio
          'rgba(0, 0, 0, 0.8)'        // Preto para legibilidade
        ] as const,
        badgeColor: '#6366F1', // Azul
        iconColor: '#6366F1',
        shadowColor: '#6366F1',
      };
    }
  };

  const cardStyles = getCardStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container, 
        isJoining && styles.containerJoining,
        { shadowColor: cardStyles.shadowColor }
      ]}
      onPress={() => onPress(community)}
      activeOpacity={0.85}
      disabled={isJoining}
    >
      <ImageBackground
        source={{
          uri: community.event?.imageUrl || community.imageUrl || 'https://via.placeholder.com/200x180'
        }}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={cardStyles.gradient}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        >
          {/* Top badges */}
          <View style={styles.topContent}>
            <View style={[styles.memberBadge, { backgroundColor: `${cardStyles.badgeColor}20` }]}>
              <Ionicons name="people" size={10} color={colors.brand.textPrimary} />
              <Text style={styles.memberText}>{formatMemberCount(community.memberCount)}</Text>
            </View>
            
            {community.canJoin && (
              <View style={[styles.availableBadge, { backgroundColor: cardStyles.badgeColor }]}>
                <View style={styles.pulseIndicator} />
              </View>
            )}

            {/* Badge do tipo de comunidade */}
            <View style={[styles.typeBadge, { backgroundColor: cardStyles.badgeColor }]}>
              <Ionicons 
                name={variant === 'event' ? "calendar" : "globe"} 
                size={8} 
                color={colors.brand.background} 
              />
            </View>
          </View>

          {/* Bottom content */}
          <View style={styles.bottomContent}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {community.event?.title || community.name || 'Comunidade Geral'}
              </Text>
              
              {community.event?.date && (
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={10} color={colors.brand.textSecondary} />
                  <Text style={styles.dateText}>{formatDate(community.event.date)}</Text>
                </View>
              )}

              {variant === 'general' && (
                <View style={styles.dateContainer}>
                  <Ionicons name="globe-outline" size={10} color={colors.brand.textSecondary} />
                  <Text style={styles.dateText}>Feed Geral</Text>
                </View>
              )}
            </View>

            {/* Action indicator */}
            <View style={[styles.actionIndicator, { borderColor: `${cardStyles.iconColor}40` }]}>
              {isJoining ? (
                <View style={styles.loadingIndicator}>
                  <View style={[styles.loadingDot, { backgroundColor: cardStyles.iconColor }]} />
                  <View style={[styles.loadingDot, styles.loadingDotDelay1, { backgroundColor: cardStyles.iconColor }]} />
                  <View style={[styles.loadingDot, styles.loadingDotDelay2, { backgroundColor: cardStyles.iconColor }]} />
                </View>
              ) : (
                <View style={styles.enterIcon}>
                  <Ionicons 
                    name={community.canJoin ? "add" : "arrow-forward"} 
                    size={16} 
                    color={cardStyles.iconColor} 
                  />
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Glass morphism overlay for premium feel */}
      <View style={styles.glassOverlay} />
      
      {/* Subtle border glow - agora dinâmico */}
      <View style={[styles.borderGlow, { borderColor: cardStyles.borderGlow }]} />
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
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
    transform: [{ scale: 1 }],
  },
  containerJoining: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    borderRadius: borderRadius.xl,
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  topContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.xs,
  },
  memberText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  availableBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  typeBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pulseIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eventInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  eventTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  actionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  enterIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    gap: 3,
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
    opacity: 0.4,
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 0.8,
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
    borderColor: 'rgba(255, 215, 0, 0.3)',
    pointerEvents: 'none',
  },
});

export const EventCommunityMiniCardSkeleton: React.FC = () => {
  return (
    <View style={[styles.container, { backgroundColor: colors.brand.darkGray }]}>
      <LinearGradient
        colors={['rgba(55, 65, 81, 0.5)', 'rgba(55, 65, 81, 0.8)']}
        style={styles.gradient}
      >
        <View style={styles.topContent}>
          <View style={[styles.memberBadge, { backgroundColor: 'rgba(55, 65, 81, 0.8)' }]} />
          <View style={[styles.availableBadge, { backgroundColor: 'rgba(55, 65, 81, 0.8)' }]} />
        </View>

        <View style={styles.bottomContent}>
          <View style={styles.eventInfo}>
            <View style={{ 
              backgroundColor: 'rgba(55, 65, 81, 0.8)', 
              height: 12, 
              borderRadius: 4, 
              marginBottom: spacing.xs 
            }} />
            <View style={{ 
              backgroundColor: 'rgba(55, 65, 81, 0.8)', 
              height: 10, 
              width: '60%', 
              borderRadius: 4 
            }} />
          </View>
          <View style={[styles.actionIndicator, { backgroundColor: 'rgba(55, 65, 81, 0.8)' }]} />
        </View>
      </LinearGradient>
    </View>
  );
}; 