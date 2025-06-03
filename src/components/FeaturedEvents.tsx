import React, { forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../theme';
import { fetchFeaturedEvents, Event } from '../services/eventsService';
import { useApiData } from '../hooks/useApiData';
import { FeaturedEventsSkeleton } from './ui';
import { getCacheConfig } from '../config/performance';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.8;
const CARD_HEIGHT = 280;

interface FeaturedEventsProps {
  onEventPress?: (event: Event) => void;
}

export interface FeaturedEventsRef {
  refresh: () => Promise<void>;
}

const FeaturedEvents = forwardRef<FeaturedEventsRef, FeaturedEventsProps>(
  ({ onEventPress }, ref) => {
    const {
      data: events,
      loading,
      error,
      refresh,
      isRefreshing,
    } = useApiData(
      () => fetchFeaturedEvents(6),
      {
        cacheKey: 'featured_events',
        ...getCacheConfig('featuredEvents'),
        refetchOnMount: true,
      }
    );

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
      refresh: async () => {
        try {
          await refresh();
        } catch (error) {
          console.error('Failed to refresh featured events:', error);
        }
      },
    }));

    const formatPrice = (price?: number) => {
      try {
        if (!price || typeof price !== 'number') return 'Gratuito';
        return `R$ ${price.toFixed(2).replace('.', ',')}`;
      } catch {
        return 'Gratuito';
      }
    };

    const formatDate = (dateString: string) => {
      try {
        if (!dateString || typeof dateString !== 'string') return 'Data não disponível';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
        });
      } catch (error) {
        return 'Data não disponível';
      }
    };

    const formatTime = (dateString: string) => {
      try {
        if (!dateString || typeof dateString !== 'string') return 'Horário não disponível';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Horário inválido';
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (error) {
        return 'Horário não disponível';
      }
    };

    const isNewEvent = (createdAt?: string) => {
      if (!createdAt) return false;
      try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const eventCreatedDate = new Date(createdAt);
        return eventCreatedDate >= threeDaysAgo;
      } catch {
        return false;
      }
    };

    const getActivityBadge = (attendees: number, createdAt?: string) => {
      try {
        const safeAttendees = typeof attendees === 'number' ? attendees : 0;
        
        // Primeiro verifica se é um evento novo (últimos 3 dias)
        if (isNewEvent(createdAt)) {
          return { icon: 'star' as const, color: '#00D4AA', label: 'Novo' };
        }
        
        // Depois verifica por popularidade
        if (safeAttendees > 1000) return { icon: 'flame' as const, color: '#FF6B35', label: 'Hot' };
        if (safeAttendees > 500) return { icon: 'trending-up' as const, color: '#F7931E', label: 'Trending' };
        if (safeAttendees > 100) return { icon: 'heart' as const, color: '#FF6B6B', label: 'Popular' };
        
        // Se não se encaixa em nenhuma categoria, não mostra badge
        return null;
      } catch {
        return null;
      }
    };

    const renderEventCard = ({ item: event }: { item: Event }) => {
      try {
        if (!event || typeof event !== 'object') {
          return null;
        }

        const activityBadge = getActivityBadge(event.attendees || 0, event.createdAt);

        // Garantir que todos os valores sejam seguros
        const safeTitle = String(event.title || 'Título não disponível');
        const safeLocation = String(event.location || 'Local não informado');
        const safeAttendees = Number(event.attendees) || 0;
        const safeDate = String(event.date || new Date().toISOString());
        const safeImageUrl = String(event.imageUrl || '');

        return (
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => {
              try {
                onEventPress?.(event);
              } catch (error) {
                console.error('Error handling event press:', error);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.imageSection}>
              <Image
                source={{ uri: safeImageUrl }}
                style={styles.eventImage}
                resizeMode="cover"
              />
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.imageOverlay}
              />
              
              {event.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={12} color={colors.brand.background} />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
              
              {activityBadge && (
                <View style={[styles.activityBadge, { backgroundColor: activityBadge.color }]}>
                  <Ionicons name={activityBadge.icon} size={12} color={colors.brand.background} />
                  <Text style={styles.activityText}>{String(activityBadge.label)}</Text>
                </View>
              )}
              
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{formatDate(safeDate)}</Text>
                <Text style={styles.timeText}>{formatTime(safeDate)}</Text>
              </View>
            </View>

            <View style={styles.contentSection}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {safeTitle}
              </Text>
              
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.brand.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {safeLocation}
                </Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={14} color={colors.brand.textSecondary} />
                  <Text style={styles.statText}>{String(safeAttendees)}</Text>
                </View>
                
                {event.rating && event.rating > 0 && (
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={14} color={colors.brand.primary} />
                    <Text style={styles.statText}>{String(Number(event.rating).toFixed(1))}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.priceSection}>
                <View style={styles.priceInfo}>
                  <Text style={styles.priceLabel}>A partir de</Text>
                  <Text style={styles.priceValue}>{formatPrice(event.lowestPrice)}</Text>
                </View>
                
                <TouchableOpacity style={styles.buyButton}>
                  <Text style={styles.buyButtonText}>Ver mais</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.brand.background} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        );
      } catch (error) {
        console.error('Error rendering event card:', error);
        return null;
      }
    };

    // Loading state
    if (loading && !events) {
      return <FeaturedEventsSkeleton count={3} />;
    }

    // Error state
    if (error && !events) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.brand.textSecondary} />
          <Text style={styles.errorText}>{String(error || 'Erro desconhecido')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Empty state
    if (!events || events.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.brand.textSecondary} />
          <Text style={styles.emptyText}>Nenhum evento em destaque encontrado</Text>
        </View>
      );
    }

    // Main render
    try {
      return (
        <FlatList
          data={events || []}
          renderItem={renderEventCard}
          keyExtractor={(item) => String(item?.id || Math.random())}
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          snapToInterval={CARD_WIDTH + spacing.lg}
          decelerationRate="fast"
          snapToAlignment="start"
          refreshing={isRefreshing}
          onRefresh={refresh}
          scrollEventThrottle={16}
          bounces={false}
          bouncesZoom={false}
          alwaysBounceVertical={false}
          alwaysBounceHorizontal={true}
          directionalLockEnabled={true}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={7}
          initialNumToRender={3}
          updateCellsBatchingPeriod={100}
        />
      );
    } catch (error) {
      console.error('Error rendering FeaturedEvents:', error);
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.brand.textSecondary} />
          <Text style={styles.errorText}>Erro ao carregar eventos em destaque</Text>
        </View>
      );
    }
  }
);

FeaturedEvents.displayName = 'FeaturedEvents';

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.lg,
  },
  eventCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
  
  // Image Section
  imageSection: {
    height: 160,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  premiumText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  activityBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  activityText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  dateBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  dateText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  timeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginTop: 2,
  },
  
  // Content Section
  contentSection: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    lineHeight: typography.fontSizes.lg * 1.3,
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  
  // Price Section
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginBottom: spacing.xs,
  },
  priceValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  buyButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  
  // Error and Empty States
  errorContainer: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.background,
  },
  emptyContainer: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
});

export default FeaturedEvents; 