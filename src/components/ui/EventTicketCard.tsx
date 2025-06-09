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
import { Ticket } from '../../services/ticketsService';

interface EventTicketCardProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  eventImageUrl?: string;
  ticketsCount: number;
  activeTicketsCount: number;
  tickets: Ticket[];
  onPress?: () => void;
  style?: ViewStyle;
}

interface EventTicketCardSkeletonProps {
  style?: ViewStyle;
}

export const EventTicketCardSkeleton: React.FC<EventTicketCardSkeletonProps> = ({ style }) => {
  const shimmerValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
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

  const SkeletonBox: React.FC<{ 
    width: number | string; 
    height: number; 
    style?: any;
    borderRadius?: number;
  }> = ({ width, height, style: boxStyle, borderRadius: br = 8 }) => (
    <View style={[styles.skeletonBox, { width, height, borderRadius: br }, boxStyle]}>
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
            'rgba(255, 215, 0, 0.0)',
            'rgba(255, 215, 0, 0.1)',
            'rgba(255, 215, 0, 0.0)',
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
        <View style={styles.imageContainer}>
          <SkeletonBox width="100%" height={140} borderRadius={0} />
        </View>
        
        {/* Content Skeleton */}
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.eventInfo}>
              <SkeletonBox width="80%" height={20} borderRadius={6} style={{ marginBottom: spacing.xs }} />
              <SkeletonBox width="60%" height={14} borderRadius={4} style={{ marginBottom: spacing.sm }} />
              <SkeletonBox width={100} height={12} borderRadius={4} />
            </View>
            <SkeletonBox width={60} height={40} borderRadius={20} />
          </View>
          
          <View style={styles.footer}>
            <SkeletonBox width={80} height={16} borderRadius={8} />
            <SkeletonBox width={40} height={16} borderRadius={8} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const EventTicketCard: React.FC<EventTicketCardProps> = ({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  eventImageUrl,
  ticketsCount,
  activeTicketsCount,
  tickets,
  onPress,
  style,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) return 'Hoje';
    if (isTomorrow) return 'Amanhã';
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getTicketStatusSummary = () => {
    const validTickets = Array.isArray(tickets) ? tickets.filter(ticket => ticket && ticket.status) : [];
    const statusCounts = validTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (statusCounts.ACTIVE > 0) {
      return {
        color: '#00D4AA',
        backgroundColor: 'rgba(0, 212, 170, 0.15)',
        text: `${statusCounts.ACTIVE} Ativo${statusCounts.ACTIVE > 1 ? 's' : ''}`,
        icon: 'checkmark-circle' as const,
      };
    }

    if (statusCounts.USED > 0) {
      return {
        color: '#8B93A1',
        backgroundColor: 'rgba(139, 147, 161, 0.15)',
        text: `${statusCounts.USED} Usado${statusCounts.USED > 1 ? 's' : ''}`,
        icon: 'checkmark-done' as const,
      };
    }

    return {
      color: colors.brand.textSecondary,
      backgroundColor: colors.brand.darkGray,
      text: 'Sem status',
      icon: 'help-circle' as const,
    };
  };

  const statusSummary = getTicketStatusSummary();

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
          
          {!imageError && eventImageUrl && (
            <Image
              source={{ uri: eventImageUrl }}
              style={[styles.eventImage, imageLoading && styles.hiddenImage]}
              resizeMode="cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
          
          {(imageError || !eventImageUrl) && renderImageError()}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)']}
            style={styles.imageOverlay}
          />

          {/* Event Date Badge */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{formatDate(eventDate)}</Text>
            <Text style={styles.timeBadgeText}>{formatTime(eventDate)}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={1}>{eventTitle}</Text>
              {eventLocation && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color={colors.brand.textSecondary} />
                  <Text style={styles.locationText} numberOfLines={1}>{eventLocation}</Text>
                </View>
              )}
            </View>
            
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusSummary.backgroundColor }]}>
              <Ionicons name={statusSummary.icon} size={12} color={statusSummary.color} />
              <Text style={[styles.statusText, { color: statusSummary.color }]}>
                {statusSummary.text}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.ticketCount}>
              {ticketsCount} ingresso{ticketsCount !== 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.brand.primary} />
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
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  
  // Image Section
  imageContainer: {
    height: 140,
    position: 'relative',
    backgroundColor: colors.brand.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
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
  dateBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  dateBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  timeBadgeText: {
    fontSize: typography.fontSizes.xs - 2,
    color: colors.brand.textSecondary,
    marginTop: 2,
  },

  // Content Section
  contentContainer: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  eventInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  eventTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  ticketCount: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },

  // Skeleton Styles
  skeletonBox: {
    backgroundColor: colors.brand.card,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
  },
}); 