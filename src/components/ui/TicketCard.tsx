import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Ticket, TicketStatus, ticketsService } from '../../services/ticketsService';

interface TicketCardProps {
  ticket: Ticket;
  onPress?: () => void;
  onQRPress?: () => void;
  variant?: 'default' | 'compact';
}

interface TicketCardSkeletonProps {
  variant?: 'default' | 'compact';
}

// Skeleton component for loading state
export const TicketCardSkeleton: React.FC<TicketCardSkeletonProps> = ({ 
  variant = 'default' 
}) => {
  const shimmerValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <LinearGradient
          colors={['#000000', '#1A1A1A']}
          style={styles.compactCard}
        >
          <View style={styles.compactContent}>
            {/* Event Image Skeleton */}
            <SkeletonBox width={80} height={80} borderRadius={12} />
            
            {/* Content */}
            <View style={styles.compactInfo}>
              {/* Status Badge */}
              <SkeletonBox width={60} height={20} borderRadius={10} style={styles.compactStatusSkeleton} />
              
              {/* Event Title */}
              <SkeletonBox width="80%" height={16} borderRadius={4} style={styles.compactTitleSkeleton} />
              <SkeletonBox width="60%" height={14} borderRadius={4} style={styles.compactSubtitleSkeleton} />
              
              {/* Date */}
              <SkeletonBox width={100} height={12} borderRadius={4} style={styles.compactDateSkeleton} />
            </View>
            
            {/* QR Button */}
            <SkeletonBox width={40} height={40} borderRadius={20} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1A1A1A']}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.eventInfo}>
              <SkeletonBox width="70%" height={18} borderRadius={6} style={styles.batchNameSkeleton} />
              <SkeletonBox width="50%" height={14} borderRadius={4} style={styles.ticketIdSkeleton} />
            </View>
            <SkeletonBox width={80} height={32} borderRadius={16} />
          </View>

          {/* Event Details */}
          <View style={styles.eventDetails}>
            <View style={styles.dateTimeRow}>
              <SkeletonBox width={120} height={36} borderRadius={18} style={styles.dateContainerSkeleton} />
              <SkeletonBox width={80} height={36} borderRadius={18} />
            </View>
            
            <View style={styles.locationRow}>
              <SkeletonBox width={16} height={16} borderRadius={8} />
              <SkeletonBox width="65%" height={14} borderRadius={4} style={styles.locationTextSkeleton} />
            </View>
          </View>

          {/* Price and Actions */}
          <View style={styles.priceRow}>
            <View style={styles.priceInfo}>
              <SkeletonBox width={60} height={12} borderRadius={4} style={styles.priceLabelSkeleton} />
              <SkeletonBox width={80} height={20} borderRadius={6} style={styles.priceValueSkeleton} />
            </View>
            <SkeletonBox width={100} height={40} borderRadius={20} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onPress,
  onQRPress,
  variant = 'default',
}) => {
  const isCompact = variant === 'compact';

  const getStatusConfig = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.ACTIVE:
        return {
          color: '#00D4AA',
          backgroundColor: 'rgba(0, 212, 170, 0.15)',
          text: 'Ativo',
          icon: 'checkmark-circle' as const,
          canUse: true,
        };
      case TicketStatus.USED:
        return {
          color: '#8B93A1',
          backgroundColor: 'rgba(139, 147, 161, 0.15)',
          text: 'Usado',
          icon: 'checkmark-done' as const,
          canUse: false,
        };
      case TicketStatus.CANCELLED:
        return {
          color: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.15)',
          text: 'Cancelado',
          icon: 'close-circle' as const,
          canUse: false,
        };
      case TicketStatus.REFUNDED:
        return {
          color: '#FFB800',
          backgroundColor: 'rgba(255, 184, 0, 0.15)',
          text: 'Reembolsado',
          icon: 'arrow-undo' as const,
          canUse: false,
        };
      default:
        return {
          color: colors.brand.textSecondary,
          backgroundColor: colors.brand.darkGray,
          text: 'Desconhecido',
          icon: 'help-circle' as const,
          canUse: false,
        };
    }
  };

  const statusConfig = getStatusConfig(ticket.status);

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
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const isUpcoming = () => {
    return new Date(ticket.event.date) > new Date();
  };

  const handleQRPress = () => {
    if (!statusConfig.canUse) {
      Alert.alert(
        'Ingresso indisponível',
        'Este ingresso não pode ser usado no momento.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isUpcoming()) {
      Alert.alert(
        'Evento já realizado',
        'Este evento já foi realizado.',
        [{ text: 'OK' }]
      );
      return;
    }

    onQRPress?.();
  };

  if (isCompact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.compactContent}>
          {/* Left: Ticket Info */}
          <View style={styles.compactInfo}>
            <View style={styles.compactHeader}>
              <Text style={styles.compactBatchName} numberOfLines={1}>
                {ticket.ticketBatch?.name || 'Ingresso'}
              </Text>
              <View style={[styles.compactStatusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
                <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                <Text style={[styles.compactStatusText, { color: statusConfig.color }]}>
                  {statusConfig.text}
                </Text>
              </View>
            </View>
            
            <Text style={styles.compactPrice}>
              {formatPrice(ticket.price)}
            </Text>
          </View>

          {/* Right: QR Action - Volta a ser botão clicável */}
          <TouchableOpacity
            style={[
              styles.compactQRButton,
              !statusConfig.canUse && styles.compactQRButtonDisabled
            ]}
            onPress={handleQRPress}
            disabled={!statusConfig.canUse}
          >
            <Ionicons 
              name="qr-code" 
              size={24} 
              color={statusConfig.canUse ? colors.brand.background : colors.brand.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Main Card */}
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.eventInfo}>
            <Text style={styles.batchName} numberOfLines={1}>
              {ticket.ticketBatch?.name || 'Ingresso Geral'}
            </Text>
            <Text style={styles.ticketId}>#{ticket.id.slice(-8).toUpperCase()}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Event Details */}
        <View style={styles.eventDetails}>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateContainer}>
              <View style={styles.dateIcon}>
                <Ionicons name="calendar" size={16} color={colors.brand.background} />
              </View>
              <Text style={styles.dateText}>{formatDate(ticket.event.date)}</Text>
            </View>
            
            <View style={styles.timeContainer}>
              <View style={styles.timeIcon}>
                <Ionicons name="time" size={16} color={colors.brand.background} />
              </View>
              <Text style={styles.timeText}>{formatTime(ticket.event.date)}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={colors.brand.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {ticket.event.venue?.name || ticket.event.location}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Valor pago</Text>
            <Text style={styles.priceValue}>
              {formatPrice(ticket.price)}
            </Text>
          </View>

          {/* QR Button */}
          <TouchableOpacity
            style={[
              styles.qrButton,
              !statusConfig.canUse && styles.qrButtonDisabled
            ]}
            onPress={handleQRPress}
            disabled={!statusConfig.canUse}
          >
            <LinearGradient
              colors={
                statusConfig.canUse 
                  ? [colors.brand.primary, '#4F8EF7']
                  : [colors.brand.textSecondary, colors.brand.textSecondary]
              }
              style={styles.qrButtonGradient}
            >
              <Ionicons 
                name="qr-code" 
                size={20} 
                color={colors.brand.background} 
              />
              <Text style={styles.qrButtonText}>
                {statusConfig.canUse ? 'Ver QR' : 'Indisponível'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ticket Perforation Effect */}
      <View style={styles.perforation}>
        {Array.from({ length: 15 }).map((_, index) => (
          <View key={index} style={styles.perforationDot} />
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default Variant
  container: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  cardContent: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  eventInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  batchName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  ticketId: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  eventDetails: {
    marginBottom: spacing.lg,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  dateIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  timeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginBottom: spacing.xs,
  },
  priceValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  qrButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  qrButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  qrButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  qrButtonDisabled: {
    opacity: 0.5,
  },
  perforation: {
    height: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: colors.brand.background,
  },
  perforationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.darkGray,
  },

  // Compact Variant
  compactContainer: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  compactInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  compactBatchName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  compactStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  compactStatusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  compactPrice: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  compactQRButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactQRButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Skeleton Styles
  skeletonBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
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
  cardGradient: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  compactCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  batchNameSkeleton: {
    marginBottom: spacing.xs,
  },
  ticketIdSkeleton: {
    marginBottom: 0,
  },
  dateContainerSkeleton: {
    marginRight: spacing.lg,
  },
  locationTextSkeleton: {
    marginLeft: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceInfo: {
    flex: 1,
  },
  priceLabelSkeleton: {
    marginBottom: spacing.xs,
  },
  priceValueSkeleton: {
    marginBottom: 0,
  },
  compactStatusSkeleton: {
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  compactTitleSkeleton: {
    marginBottom: spacing.xs,
  },
  compactSubtitleSkeleton: {
    marginBottom: spacing.sm,
  },
  compactDateSkeleton: {
    marginBottom: 0,
  },
}); 