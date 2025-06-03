import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Event } from '../../services/eventsService';

interface SearchEventCardProps {
  event: Event;
  onPress?: () => void;
  style?: ViewStyle;
}

export const SearchEventCard: React.FC<SearchEventCardProps> = ({
  event,
  onPress,
  style,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Gratuito';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const formatAttendees = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'SHOW':
        return colors.brand.secondary;
      case 'SPORTS':
        return colors.brand.primary;
      case 'THEATER':
        return colors.brand.secondary;
      case 'FESTIVAL':
        return colors.brand.primary;
      case 'PREMIUM':
        return colors.brand.primary;
      default:
        return colors.brand.textSecondary;
    }
  };

  const getEventTypeLabel = (type?: string) => {
    switch (type) {
      case 'SHOW':
        return 'Show';
      case 'SPORTS':
        return 'Esporte';
      case 'THEATER':
        return 'Teatro';
      case 'FESTIVAL':
        return 'Festival';
      case 'PREMIUM':
        return 'Premium';
      default:
        return 'Evento';
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const renderImageSkeleton = () => (
    <View style={styles.imageSkeleton}>
      <View style={styles.skeletonShimmer} />
      <View style={styles.imageSkeletonIcon}>
        <Ionicons name="image" size={32} color={colors.brand.textSecondary} />
      </View>
    </View>
  );

  const renderImageError = () => (
    <View style={styles.imageError}>
      <Ionicons name="image-outline" size={32} color={colors.brand.textSecondary} />
      <Text style={styles.imageErrorText}>Imagem não disponível</Text>
    </View>
  );

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Event Image */}
        <View style={styles.imageContainer}>
          {imageLoading && renderImageSkeleton()}
          
          {!imageError && (
            <Image
              source={{ uri: event.imageUrl }}
              style={[styles.eventImage, imageLoading && styles.hiddenImage]}
              resizeMode="cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
          
          {imageError && renderImageError()}
          
          {!imageLoading && !imageError && (
            <>
              {/* Image Overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.imageOverlay}
              />
              
              {/* Premium Badge */}
              {event.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={10} color={colors.brand.background} />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
              
              {/* Event Type Badge */}
              {event.type && (
                <View style={[styles.typeBadge, { backgroundColor: getEventTypeColor(event.type) }]}>
                  <Text style={styles.typeText}>{getEventTypeLabel(event.type)}</Text>
                </View>
              )}
              
              {/* Date Badge */}
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{formatDate(event.date)}</Text>
                <Text style={styles.timeText}>{formatTime(event.date)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Event Content */}
        <View style={styles.content}>
          {/* Title and Price Row */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceValue}>{formatPrice(event.lowestPrice)}</Text>
            </View>
          </View>
          
          {/* Location and Stats Row */}
          <View style={styles.infoRow}>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color={colors.brand.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              {event.attendees && event.attendees > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="people" size={12} color={colors.brand.textSecondary} />
                  <Text style={styles.statText}>{formatAttendees(event.attendees)}</Text>
                </View>
              )}
              
              {event.rating && event.rating > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="star" size={12} color={colors.brand.primary} />
                  <Text style={styles.statText}>{event.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  
  // Image Section
  imageContainer: {
    height: 120,
    position: 'relative',
    backgroundColor: colors.brand.card,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  hiddenImage: {
    opacity: 0,
  },
  imageSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.brand.card,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.brand.card,
  },
  imageSkeletonIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageError: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.brand.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  premiumText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  typeBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  dateBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  dateText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  timeText: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.brand.textSecondary,
    marginTop: 1,
  },
  
  // Content Section
  content: {
    padding: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    lineHeight: typography.fontSizes.md * 1.2,
    flex: 1,
    marginRight: spacing.sm,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
}); 