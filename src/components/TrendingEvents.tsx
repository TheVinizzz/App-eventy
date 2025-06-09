import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { fetchTrendingEvents, TrendingEvent } from '../services/eventsService';
import { useApiData } from '../hooks/useApiData';
import { getCacheConfig } from '../config/performance';

interface TrendingEventsProps {
  onEventPress?: (eventId: string) => void;
  limit?: number;
}

const TrendingEvents: React.FC<TrendingEventsProps> = ({ 
  onEventPress, 
  limit = 5 
}) => {
  const {
    data: trendingEvents,
    loading,
    error,
    refresh,
  } = useApiData(
    () => fetchTrendingEvents(limit),
    {
      cacheKey: 'trending_events',
      ...getCacheConfig('trendingEvents'),
      refetchOnMount: true,
    }
  );

  const handleEventPress = useCallback((event: TrendingEvent) => {
    onEventPress?.(event.id);
  }, [onEventPress]);

  const getTrendPercentage = (event: TrendingEvent): string => {
    // Simular percentual de trending baseado no activityLevel e scores
    const { activityLevel, recentActivityScore } = event;
    
    if (activityLevel === 'trending') {
      const percentage = Math.min(300, Math.max(200, (recentActivityScore || 0) * 10));
      return `+${percentage}%`;
    } else if (activityLevel === 'high') {
      const percentage = Math.min(199, Math.max(150, (recentActivityScore || 0) * 8));
      return `+${percentage}%`;
    } else if (activityLevel === 'medium') {
      const percentage = Math.min(149, Math.max(100, (recentActivityScore || 0) * 6));
      return `+${percentage}%`;
    } else {
      const percentage = Math.min(99, Math.max(50, (recentActivityScore || 0) * 4));
      return `+${percentage}%`;
    }
  };

  const getTrendColor = (activityLevel: TrendingEvent['activityLevel']): string => {
    switch (activityLevel) {
      case 'trending': return '#FF6B35'; // Laranja vibrante
      case 'high': return '#F7931E'; // Laranja
      case 'medium': return '#FFD700'; // Dourado
      default: return '#90EE90'; // Verde claro
    }
  };

  const getTrendIcon = (activityLevel: TrendingEvent['activityLevel']) => {
    switch (activityLevel) {
      case 'trending': return 'flame' as const;
      case 'high': return 'trending-up' as const;
      case 'medium': return 'arrow-up' as const;
      default: return 'chevron-up' as const;
    }
  };

  // Loading state
  if (loading && !trendingEvents) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
        <Text style={styles.loadingText}>Carregando trends...</Text>
      </View>
    );
  }

  // Error state
  if (error && !trendingEvents) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={20} color={colors.brand.textSecondary} />
        <Text style={styles.errorText}>Erro ao carregar trends</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!trendingEvents || trendingEvents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trending-up-outline" size={24} color={colors.brand.textSecondary} />
        <Text style={styles.emptyText}>Nenhum evento trending encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {trendingEvents.map((event, index) => (
        <TouchableOpacity
          key={event.id}
          style={styles.trendingItem}
          onPress={() => handleEventPress(event)}
          activeOpacity={0.8}
        >
          <View style={styles.trendingContent}>
            <View style={styles.trendingInfo}>
              <Text style={styles.trendingTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={styles.trendingCategory}>
                {event.category || 'Evento'}
              </Text>
              <View style={styles.trendingMeta}>
                <View style={styles.metaItem}>
                  <Ionicons 
                    name="people" 
                    size={12} 
                    color={colors.brand.textSecondary} 
                  />
                  <Text style={styles.metaText}>
                    {event.attendances} interessados
                  </Text>
                </View>
                {event.posts > 0 && (
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name="chatbubble" 
                      size={12} 
                      color={colors.brand.textSecondary} 
                    />
                    <Text style={styles.metaText}>
                      {event.posts} posts
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.trendingStats}>
              <View style={[
                styles.trendingBadge, 
                { backgroundColor: getTrendColor(event.activityLevel) }
              ]}>
                <Ionicons 
                  name={getTrendIcon(event.activityLevel)} 
                  size={12} 
                  color={colors.brand.background} 
                />
                <Text style={styles.trendingPercent}>
                  {getTrendPercentage(event)}
                </Text>
              </View>
              {event.price && (
                <Text style={styles.priceText}>
                  {event.price}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  trendingItem: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.darkGray,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trendingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trendingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  trendingTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: typography.fontSizes.md * 1.3,
  },
  trendingCategory: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.sm,
  },
  trendingMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  trendingStats: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  trendingPercent: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  priceText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  retryButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.background,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
});

export default TrendingEvents; 