import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { UserProfile } from '../services/socialService';

interface UserSearchItemProps {
  user: UserProfile;
  onPress: (user: UserProfile) => void;
  onFollowPress?: (user: UserProfile) => void;
  showFollowButton?: boolean;
}

const UserSearchItem: React.FC<UserSearchItemProps> = ({
  user,
  onPress,
  onFollowPress,
  showFollowButton = true,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handlePress = () => {
    onPress(user);
  };

  const handleFollowPress = () => {
    onFollowPress?.(user);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          {user.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {user.followersCount} seguidores • {user.postsCount} posts
            </Text>
          </View>
        </View>
      </View>

      {showFollowButton && (
        <TouchableOpacity
          style={[
            styles.followButton,
            user.isFollowing && styles.followingButton,
          ]}
          onPress={handleFollowPress}
        >
          <Text
            style={[
              styles.followButtonText,
              user.isFollowing && styles.followingButtonText,
            ]}
          >
            {user.isFollowing ? 'Seguindo' : 'Seguir'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.brand.textSecondary + '20',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.brand.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  avatarText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  bio: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  stats: {
    marginTop: spacing.xs,
  },
  statsText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
  },
  followButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  followButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  followingButtonText: {
    color: colors.brand.primary,
  },
});

export default UserSearchItem; 