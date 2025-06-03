import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Story } from '../../services/socialService';

interface StoryCardProps {
  story: Story;
  onPress?: (story: Story) => void;
  onUserPress?: (userId: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onPress,
  onUserPress,
}) => {
  const handlePress = () => {
    onPress?.(story);
  };

  const handleUserPress = () => {
    onUserPress?.(story.author.id);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isExpired = new Date(story.expiresAt) < new Date();

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <ImageBackground
        source={{ uri: story.mediaUrl }}
        style={styles.storyBackground}
        imageStyle={styles.storyImage}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          {/* Story overlay text */}
          {story.textOverlay && (
            <View style={styles.textOverlay}>
              <Text 
                style={[
                  styles.overlayText,
                  {
                    color: story.textColor || 'white',
                    fontSize: story.textSize || 16,
                  }
                ]}
              >
                {story.textOverlay}
              </Text>
            </View>
          )}

          {/* User info at bottom */}
          <View style={styles.userInfo}>
            <TouchableOpacity style={styles.userButton} onPress={handleUserPress}>
              <View style={[styles.avatar, story.viewed && styles.viewedAvatar]}>
                {story.author.profileImage ? (
                  <Image source={{ uri: story.author.profileImage }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(story.author.name)}</Text>
                )}
              </View>
              <Text style={styles.userName} numberOfLines={1}>
                {story.author.name}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Viewed indicator */}
          {story.viewed && (
            <View style={styles.viewedIndicator}>
              <Text style={styles.viewedText}>Visualizado</Text>
            </View>
          )}

          {/* Expired overlay */}
          {isExpired && (
            <View style={styles.expiredOverlay}>
              <Text style={styles.expiredText}>Expirado</Text>
            </View>
          )}
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 200,
    marginRight: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  storyBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  storyImage: {
    borderRadius: borderRadius.lg,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  textOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    textAlign: 'center',
    fontWeight: typography.fontWeights.bold,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userInfo: {
    alignItems: 'center',
  },
  userButton: {
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  viewedAvatar: {
    borderColor: colors.brand.textSecondary,
    opacity: 0.7,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  avatarText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  userName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  viewedIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  viewedText: {
    fontSize: typography.fontSizes.xs,
    color: 'white',
    fontWeight: typography.fontWeights.medium,
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiredText: {
    fontSize: typography.fontSizes.md,
    color: 'white',
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
  },
}); 