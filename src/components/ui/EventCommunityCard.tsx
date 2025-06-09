import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { EventCommunity } from '../../services/eventCommunityService';

interface EventCommunityCardProps {
  community: EventCommunity;
  onPress: () => void;
}

export const EventCommunityCard: React.FC<EventCommunityCardProps> = ({
  community,
  onPress,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground
        source={{
          uri: community.event.imageUrl || community.imageUrl || 'https://via.placeholder.com/400x200'
        }}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.8)']}
          style={styles.gradient}
        >
          {/* Top Content */}
          <View style={styles.topContent}>
            <View style={styles.badge}>
              <Ionicons name="people" size={12} color={colors.brand.textPrimary} />
              <Text style={styles.badgeText}>{formatMemberCount(community.memberCount)}</Text>
            </View>
            
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          {/* Bottom Content */}
          <View style={styles.bottomContent}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {community.event.title}
            </Text>
            
            <View style={styles.eventDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={12} color={colors.brand.textSecondary} />
                <Text style={styles.detailText}>{formatDate(community.event.date)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={12} color={colors.brand.textSecondary} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {community.event.venue.name}
                </Text>
              </View>
            </View>

            <View style={styles.communityInfo}>
              <Text style={styles.communityName} numberOfLines={1}>
                {community.name}
              </Text>
              <View style={styles.activityIndicator}>
                <View style={styles.activeIndicator} />
                <Text style={styles.activityText}>Ativa</Text>
              </View>
            </View>

            {/* Enter Button */}
            <TouchableOpacity style={styles.enterButton} onPress={onPress}>
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={styles.enterButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.enterButtonText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={16} color="#000000" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  backgroundImage: {
    height: 280,
    justifyContent: 'space-between',
  },
  imageStyle: {
    borderRadius: borderRadius.xl,
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  topContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  badgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginLeft: spacing.xs,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.textPrimary,
    marginRight: spacing.xs,
  },
  liveText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  bottomContent: {
    gap: spacing.md,
  },
  eventTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    lineHeight: 24,
  },
  eventDetails: {
    gap: spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    opacity: 0.9,
  },
  communityInfo: {
    gap: spacing.xs,
  },
  communityName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  activityText: {
    fontSize: typography.fontSizes.xs,
    color: '#10B981',
    fontWeight: typography.fontWeights.medium,
  },
  enterButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  enterButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    gap: spacing.xs,
  },
  enterButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: '#000000',
  },
});

// Skeleton version for loading state
export const EventCommunityCardSkeleton: React.FC = () => {
  return (
    <View style={[styles.container, { backgroundColor: colors.brand.darkGray }]}>
      <View style={styles.backgroundImage}>
        <LinearGradient
          colors={['rgba(55, 65, 81, 0.5)', 'rgba(55, 65, 81, 0.8)']}
          style={styles.gradient}
        >
          <View style={styles.topContent}>
            <View style={[styles.badge, { backgroundColor: 'rgba(55, 65, 81, 0.8)' }]} />
            <View style={[styles.liveBadge, { backgroundColor: 'rgba(55, 65, 81, 0.8)' }]} />
          </View>

          <View style={styles.bottomContent}>
            <View style={{ backgroundColor: 'rgba(55, 65, 81, 0.8)', height: 20, borderRadius: 4 }} />
            <View style={{ backgroundColor: 'rgba(55, 65, 81, 0.8)', height: 16, width: '70%', borderRadius: 4 }} />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}; 