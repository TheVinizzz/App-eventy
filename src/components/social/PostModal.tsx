import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import socialService, { Post } from '../../services/socialService';
import CommentsModal from './CommentsModal';

const { width, height } = Dimensions.get('window');

interface PostModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  onLike?: (postId: string) => void;
  onUserPress?: (userId: string) => void;
  onEventPress?: (eventId: string) => void;
}

const PostModal: React.FC<PostModalProps> = ({
  visible,
  onClose,
  postId,
  onLike,
  onUserPress,
  onEventPress,
}) => {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      loadPost();
    }
  }, [visible, postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postData = await socialService.getPost(postId);
      setPost(postData);
      setIsLiked(postData.isLiked || false);
      setLikesCount(postData._count?.likes || 0);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Erro', 'Não foi possível carregar o post.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post || likeLoading) return;
    
    try {
      setLikeLoading(true);
      
      // Optimistic update
      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
      
      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);
      
      const result = await socialService.likePost(post.id);
      
      // Update with server response
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
      
      onLike?.(post.id);
    } catch (error) {
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount + 1 : likesCount - 1);
      console.error('Error liking post:', error);
      Alert.alert('Erro', 'Não foi possível curtir o post.');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleUserPress = () => {
    if (post?.author.id) {
      onUserPress?.(post.author.id);
      onClose();
    }
  };

  const handleEventPress = () => {
    if (post?.event?.id) {
      onEventPress?.(post.event.id);
      onClose();
    }
  };

  const handleCommentsPress = () => {
    setShowComments(true);
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

    const mentionPattern = `@${eventTitle}`;
    const regex = new RegExp(`(${mentionPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);
    
    if (parts.length === 1) {
      return <Text style={styles.contentText}>{content}</Text>;
    }

    return (
      <Text style={styles.contentText}>
        {parts.map((part, index) => {
          if (part.toLowerCase() === mentionPattern.toLowerCase()) {
            return (
              <Text
                key={index}
                style={styles.eventMention}
                onPress={handleEventPress}
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
      
      <View style={styles.overlay}>
        <BlurView intensity={20} style={styles.blurContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeButtonContainer}>
              <Ionicons name="close" size={24} color={colors.brand.textPrimary} />
            </View>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
              <Text style={styles.loadingText}>Carregando post...</Text>
            </View>
          ) : post ? (
            <View style={styles.postContainer}>
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
              </View>

              {/* Post Image */}
              {post.imageUrl && (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: post.imageUrl }} 
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Content */}
              {post.content && (
                <View style={styles.contentContainer}>
                  {renderContent(post.content, post.event?.id, post.event?.title)}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleLike}
                  disabled={likeLoading}
                >
                  <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={28} 
                    color={isLiked ? colors.brand.error : colors.brand.textPrimary} 
                  />
                  <Text style={[styles.actionText, isLiked && styles.likedText]}>
                    {likesCount}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleCommentsPress}>
                  <Ionicons name="chatbubble-outline" size={28} color={colors.brand.textPrimary} />
                  <Text style={styles.actionText}>{post._count?.comments || 0}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={28} color={colors.brand.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </BlurView>
      </View>

      {/* Comments Modal */}
      {post && (
        <CommentsModal
          visible={showComments}
          onClose={() => setShowComments(false)}
          post={post}
          onUserPress={onUserPress}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    width: width * 0.95,
    maxHeight: height * 0.9,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.brand.darkGray + 'E6',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
  },
  closeButtonContainer: {
    backgroundColor: colors.brand.background + 'CC',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand.primary + '40',
  },
  loadingContainer: {
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginTop: spacing.md,
  },
  postContainer: {
    padding: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  userSection: {
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  timeAgo: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: colors.brand.background,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    marginBottom: spacing.lg,
  },
  contentText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    lineHeight: typography.fontSizes.md * 1.5,
  },
  eventMention: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.bold,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.brand.textSecondary + '20',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.brand.background + '40',
  },
  actionText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    marginLeft: spacing.sm,
    fontWeight: typography.fontWeights.medium,
  },
  likedText: {
    color: colors.brand.error,
  },
});

export default PostModal; 