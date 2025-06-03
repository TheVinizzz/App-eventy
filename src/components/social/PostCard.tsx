import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Post } from '../../services/socialService';
import PostOptionsModal from './PostOptionsModal';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onUserPress?: (userId: string) => void;
  onEventPress?: (eventId: string) => void;
  onPostPress?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onReportPost?: (postId: string, reason: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onUserPress,
  onEventPress,
  onPostPress,
  onDeletePost,
  onReportPost,
}) => {
  // Use props directly for Instagram-style real-time updates
  const isLiked = post.isLiked || false;
  const likesCount = post._count?.likes || 0;
  const commentsCount = post._count?.comments || 0;
  
  // Modal state
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const handleLike = () => {
    // Instagram-style: immediate callback, parent handles optimistic update
    onLike?.(post.id);
  };

  const handleComment = () => {
    onComment?.(post.id);
  };

  const handleShare = () => {
    onShare?.(post.id);
  };

  const handleUserPress = () => {
    onUserPress?.(post.author.id);
  };

  const handleEventPress = (eventId: string) => {
    onEventPress?.(eventId);
  };

  const handleMorePress = () => {
    setShowOptionsModal(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const renderContent = (content: string, eventId?: string, eventTitle?: string) => {
    if (!eventId || !eventTitle) {
      return <Text style={styles.contentText}>{content}</Text>;
    }

    // Create the mention pattern for this specific event
    const mentionPattern = `@${eventTitle}`;
    
    // Use regex to find all mentions and their positions
    const regex = new RegExp(`(${mentionPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);
    
    if (parts.length === 1) {
      // No mention found, return normal text
      return <Text style={styles.contentText}>{content}</Text>;
    }

    return (
      <Text style={styles.contentText}>
        {parts.map((part, index) => {
          // Check if this part is a mention (case insensitive)
          if (part.toLowerCase() === mentionPattern.toLowerCase()) {
            return (
              <Text
                key={index}
                style={styles.eventMention}
                onPress={() => handleEventPress(eventId)}
              >
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userSection} onPress={handleUserPress}>
          <View style={styles.avatar}>
            {post.author.profileImage ? (
              <Image source={{ uri: post.author.profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(post.author.name)}</Text>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.author.name}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.brand.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content with Event Mentions */}
      {post.content && (
        <View style={styles.contentContainer}>
          {renderContent(post.content, post.event?.id, post.event?.title)}
        </View>
      )}

      {/* Post Image - Instagram style */}
      {post.imageUrl && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: post.imageUrl }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? colors.brand.error : colors.brand.textSecondary} 
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {likesCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onPostPress ? onPostPress(post.id) : handleComment()}
        >
          <Ionicons name="chatbubble-outline" size={24} color={colors.brand.textSecondary} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.brand.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Options Modal */}
      {currentUserId && (
        <PostOptionsModal
          visible={showOptionsModal}
          onClose={() => setShowOptionsModal(false)}
          post={post}
          currentUserId={currentUserId}
          onDeletePost={onDeletePost}
          onReportPost={onReportPost}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brand.darkGray,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  timeAgo: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
  },
  moreButton: {
    padding: spacing.sm,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  contentText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    lineHeight: typography.fontSizes.md * 1.4,
  },
  eventMention: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.bold,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 2,
    borderRadius: 3,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Square aspect ratio like Instagram
    backgroundColor: colors.brand.background,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.brand.textSecondary + '20',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginLeft: spacing.xs,
  },
  likedText: {
    color: colors.brand.error,
  },
});

export default memo(PostCard); 