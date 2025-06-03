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

interface UserListItemProps {
  user: UserProfile;
  onPress: (user: UserProfile) => void;
  showFollowButton?: boolean;
  onFollowPress?: (user: UserProfile) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({
  user,
  onPress,
  showFollowButton = false,
  onFollowPress,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(user)}
      activeOpacity={0.8}
    >
      <View style={styles.avatarContainer}>
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userDetails}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.name}
          </Text>
          {user.bio && (
            <Text style={styles.userBio} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {user.followersCount} seguidores
            </Text>
            <Text style={styles.statsSeparator}>•</Text>
            <Text style={styles.statsText}>
              {user.postsCount} posts
            </Text>
          </View>
        </View>

        {showFollowButton && onFollowPress && (
          <TouchableOpacity
            style={[
              styles.followButton,
              user.isFollowing && styles.followingButton,
            ]}
            onPress={() => onFollowPress(user)}
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

        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() => onPress(user)}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.brand.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.brand.darkGray,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  avatarText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  userBio: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textTertiary,
  },
  statsSeparator: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textTertiary,
    marginHorizontal: spacing.sm,
  },
  followButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  followButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  followingButtonText: {
    color: colors.brand.primary,
  },
  viewProfileButton: {
    padding: spacing.xs,
  },
});

export default UserListItem; 