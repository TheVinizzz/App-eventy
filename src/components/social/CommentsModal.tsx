import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import socialService, { Post } from '../../services/socialService';
import { eventCommunityService } from '../../services/eventCommunityService';

const { width, height } = Dimensions.get('window');

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  _count?: {
    likes: number;
  };
  isLiked?: boolean;
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
  onUserPress?: (userId: string) => void;
  onCommentAdded?: (postId: string, newCommentCount: number) => void;
  isEventCommunity?: boolean;
  eventId?: string;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  onClose,
  post,
  onUserPress,
  onCommentAdded,
  isEventCommunity = false,
  eventId,
}) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      loadComments();
      // Animate modal in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      // Animate modal out
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // KeyboardAvoidingView handles keyboard automatically
  // No manual keyboard listeners needed

  const loadComments = async () => {
    try {
      setLoading(true);
      console.log('Loading comments for post:', post.id, 'isEventCommunity:', isEventCommunity);
      
      let commentsData;
      if (isEventCommunity) {
        commentsData = await eventCommunityService.getPostComments(post.id);
      } else {
        commentsData = await socialService.getPostComments(post.id);
      }
      
      console.log('Comments loaded:', commentsData);
      
      // Normalizar estrutura dos comentários para garantir compatibilidade
      const normalizedComments = (commentsData || []).map(comment => ({
        ...comment,
        _count: comment._count || { likes: 0 },
        isLiked: comment.isLiked || false
      }));
      
      setComments(normalizedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
      // Don't show alert for empty comments, just log
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadComments();
    setRefreshing(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      console.log('Adding comment to post:', post.id, 'isEventCommunity:', isEventCommunity);
      
      let comment;
      if (isEventCommunity) {
        comment = await eventCommunityService.addComment(post.id, newComment.trim());
      } else {
        comment = await socialService.addComment(post.id, newComment.trim());
      }
      
      // Normalizar estrutura do comentário
      const normalizedComment = {
        ...comment,
        _count: comment._count || { likes: 0 },
        isLiked: comment.isLiked || false
      };
      
      setComments(prev => [normalizedComment, ...prev]);
      setNewComment('');
      
      // Dismiss keyboard after sending
      textInputRef.current?.blur();
      
      // Scroll to top to show new comment
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);

      if (onCommentAdded) {
        onCommentAdded(post.id, comments.length + 1);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o comentário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      let result;
      if (isEventCommunity) {
        // Para posts de comunidade, implementar quando disponível no backend
        console.log('Like comment in event community not implemented yet');
        return;
      } else {
        result = await socialService.likeComment(commentId);
      }
      
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                isLiked: result.isLiked,
                _count: { 
                  ...comment._count,
                  likes: result.likesCount || 0
                }
              }
            : comment
        )
      );
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Erro', 'Não foi possível curtir o comentário.');
    }
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

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <TouchableOpacity onPress={() => onUserPress?.(item.author.id)}>
        <View style={styles.commentAvatar}>
          {item.author.profileImage ? (
            <Image source={{ uri: item.author.profileImage }} style={styles.commentAvatarImage} />
          ) : (
            <Text style={styles.commentAvatarText}>{getInitials(item.author.name)}</Text>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <TouchableOpacity onPress={() => onUserPress?.(item.author.id)}>
            <Text style={styles.commentAuthor}>{item.author.name}</Text>
          </TouchableOpacity>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>
        
        <View style={styles.commentActions}>
          <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
          
          <TouchableOpacity 
            style={styles.commentLikeButton}
            onPress={() => handleLikeComment(item.id)}
          >
            <Ionicons 
              name={(item.isLiked || false) ? "heart" : "heart-outline"} 
              size={16} 
              color={(item.isLiked || false) ? colors.brand.error : colors.brand.textSecondary} 
            />
            {(item._count?.likes || 0) > 0 && (
                              <Text style={[styles.commentLikeText, (item.isLiked || false) && styles.commentLikedText]}>
                {item._count?.likes || 0}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerHandle} />
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Comentários</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.brand.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* Post Preview */}
      <View style={styles.postPreview}>
        <View style={styles.postAuthor}>
          <View style={styles.postAvatar}>
            {post.author.profileImage ? (
              <Image source={{ uri: post.author.profileImage }} style={styles.postAvatarImage} />
            ) : (
              <Text style={styles.postAvatarText}>{getInitials(post.author.name)}</Text>
            )}
          </View>
          <Text style={styles.postAuthorName}>{post.author.name}</Text>
        </View>
        {post.content && (
          <Text style={styles.postContent} numberOfLines={2}>{post.content}</Text>
        )}
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <View style={styles.userAvatar}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.userAvatarImage} />
          ) : (
            <Text style={styles.userAvatarText}>{getInitials(user?.name || 'U')}</Text>
          )}
        </View>
        
        <View style={styles.inputField}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="Adicione um comentário..."
            placeholderTextColor={colors.brand.textSecondary + 'CC'}
            value={newComment}
            onChangeText={setNewComment}
            multiline={true}
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            enablesReturnKeyAutomatically={true}
            scrollEnabled={true}
            numberOfLines={1}
            onSubmitEditing={handleSubmitComment}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.brand.primary} />
          ) : (
            <Ionicons 
              name="send" 
              size={24} 
              color={newComment.trim() ? colors.brand.primary : colors.brand.textSecondary} 
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" />
      
            <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { 
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
            <BlurView intensity={30} style={styles.blurContainer}>
              {renderHeader()}
              
              <View style={styles.contentContainer}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.brand.primary} />
                    <Text style={styles.loadingText}>Carregando comentários...</Text>
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                      styles.commentsList,
                      comments.length === 0 && styles.emptyCommentsList
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    inverted={false}
                    ListEmptyComponent={
                      <View style={styles.emptyState}>
                        <Ionicons name="chatbubble-outline" size={48} color={colors.brand.textSecondary} />
                        <Text style={styles.emptyStateText}>Seja o primeiro a comentar!</Text>
                        <Text style={styles.debugText}>Debug: {comments.length} comentários</Text>
                      </View>
                    }
                  />
                )}
              </View>
              
              {renderFooter()}
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    height: height * 0.85,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
    maxHeight: height * 0.9,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: colors.brand.darkGray + 'F0',
  },
  header: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.textSecondary + '20',
  },
  headerHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.brand.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.background + '40',
  },
  postPreview: {
    paddingBottom: spacing.lg,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  postAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  postAvatarText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  postAuthorName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  postContent: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginTop: spacing.md,
  },
  commentsList: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  emptyCommentsList: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand.primary + '60',
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  commentAvatarText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: colors.brand.background + '80',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.brand.primary + '20',
  },
  commentAuthor: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  commentText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textPrimary,
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  commentTime: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginRight: spacing.md,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  commentLikeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginLeft: spacing.xs,
  },
  commentLikedText: {
    color: colors.brand.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyStateText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  debugText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary + '80',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.brand.textSecondary + '30',
    backgroundColor: colors.brand.darkGray + 'F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    minHeight: 80,
    gap: spacing.md,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.primary,
    flexShrink: 0,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  userAvatarText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  inputField: {
    flex: 1,
    backgroundColor: colors.brand.background + 'CC',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.brand.primary + '80',
    maxHeight: 140,
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 56,
    textAlignVertical: 'center',
    lineHeight: 22,
    includeFontPadding: false,
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: colors.brand.background + '40',
    borderColor: colors.brand.textSecondary + '40',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default CommentsModal; 