import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    time?: string;
    location: string;
    price?: string;
    category?: string;
    imageUrl?: string;
  };
  onPress?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  style?: ViewStyle;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onFavorite,
  isFavorite = false,
  variant = 'default',
  style,
}) => {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  const cardStyle: ViewStyle = {
    ...styles.card,
    ...(isFeatured && styles.featuredCard),
    ...style,
  };

  const imageHeight = isFeatured ? 120 : isCompact ? 60 : 100;

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite();
    }
  };

  return (
    <Card style={cardStyle}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={[styles.content, isCompact && styles.compactContent]}>
          {/* Event Image Placeholder */}
          <View style={[
            styles.imagePlaceholder, 
            { height: imageHeight },
            isCompact && styles.compactImage
          ]}>
            <Ionicons 
              name="calendar" 
              size={isCompact ? 24 : 32} 
              color={colors.brand.primary} 
            />
            {onFavorite && (
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={handleFavorite}
              >
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'} 
                  size={20} 
                  color={isFavorite ? colors.brand.error : colors.brand.textSecondary} 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Event Info */}
          <View style={[styles.info, isCompact && styles.compactInfo]}>
            {event.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>
            )}
            
            <Text style={[
              styles.title, 
              isCompact && styles.compactTitle
            ]} numberOfLines={1}>
              {event.title}
            </Text>
            
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Ionicons 
                  name="calendar-outline" 
                  size={14} 
                  color={colors.brand.primary} 
                />
                <Text style={styles.detailText}>
                  {event.date}{event.time && ` • ${event.time}`}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons 
                  name="location-outline" 
                  size={14} 
                  color={colors.brand.textSecondary} 
                />
                <Text style={styles.detailText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
              
              {event.price && (
                <View style={styles.detailRow}>
                  <Ionicons 
                    name="pricetag-outline" 
                    size={14} 
                    color={colors.brand.primary} 
                  />
                  <Text style={[styles.detailText, styles.priceText]}>
                    {event.price}
                  </Text>
                </View>
              )}
            </View>

            {!isCompact && (
              <Button
                title="Ver Detalhes"
                onPress={handlePress}
                size="sm"
                style={styles.button}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  featuredCard: {
    marginRight: spacing.md,
    width: 280,
  },
  content: {
    flex: 1,
  },
  compactContent: {
    flexDirection: 'row',
  },
  imagePlaceholder: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  compactImage: {
    width: 60,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  compactInfo: {
    justifyContent: 'center',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.darkGray,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  categoryText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  compactTitle: {
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.xs,
  },
  details: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  priceText: {
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  button: {
    alignSelf: 'flex-start',
  },
}); 