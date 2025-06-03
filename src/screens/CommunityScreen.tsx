import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Card, Button } from '../components/ui';
import { CreatePostModal, CreateStoryModal, StoriesViewer, PostCard, CommentsModal } from '../components/social';
import { colors, spacing, typography, borderRadius } from '../theme';
import socialService, { Post, Story } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';

interface GroupedStories {
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

type CommunityScreenNavigationProp = any;

const CommunityScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<CommunityScreenNavigationProp>();
  
  // Use Instagram-style posts hook
  const {
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMorePosts,
    error,
    loadPosts,
    refreshPosts,
    loadMorePosts,
    updatePostLikes,
    updatePostComments,
    addNewPost,
    removePost,
    togglePostLike,
  } = usePosts();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoriesViewer, setShowStoriesViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [selectedUserStories, setSelectedUserStories] = useState<Story[]>([]);
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      // Load posts using the hook and stories separately
      await Promise.all([
        loadPosts(),
        loadStories()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [loadPosts]);

  const loadStories = useCallback(async () => {
    try {
      const storiesData = await socialService.getStories(1, 20);
      setStories(Array.isArray(storiesData) ? storiesData : []);
      setGroupedStories(groupStoriesByUser(Array.isArray(storiesData) ? storiesData : []));
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  }, []);

  const groupStoriesByUser = (stories: Story[]): GroupedStories[] => {
    if (!Array.isArray(stories) || stories.length === 0) {
      return [];
    }
    
    const userStoriesMap = new Map<string, GroupedStories>();
    
    // Ordenar stories por data de criação (mais antigo primeiro)
    const sortedStories = [...stories].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    sortedStories.forEach(story => {
      const userId = story.author.id;
      
      if (!userStoriesMap.has(userId)) {
        userStoriesMap.set(userId, {
          user: story.author,
          stories: [],
          hasUnviewed: false,
        });
      }
      
      const userStories = userStoriesMap.get(userId)!;
      userStories.stories.push(story);
      
      if (!story.viewed) {
        userStories.hasUnviewed = true;
      }
    });
    
    // Ordenar usuários: primeiro os que têm stories não visualizados
    return Array.from(userStoriesMap.values()).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      
      // Se ambos têm o mesmo status de visualização, ordenar pelo story mais recente
      const aLatestStory = Math.max(...a.stories.map(s => new Date(s.createdAt).getTime()));
      const bLatestStory = Math.max(...b.stories.map(s => new Date(s.createdAt).getTime()));
      
      return bLatestStory - aLatestStory; // Mais recente primeiro
    });
  };

  const handleRefresh = useCallback(async () => {
    try {
      // Refresh both posts (via hook) and stories
      await Promise.all([
        refreshPosts(),
        loadStories()
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  }, [refreshPosts, loadStories]);

  // Instagram-style like handler - instant feedback
  const handleLikePost = useCallback(async (postId: string) => {
    // Add haptic feedback for instant response
    try {
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, continue without it
    }
    
    // Use the optimistic toggle method
    await togglePostLike(postId);
  }, [togglePostLike]);

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja deletar este post?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await socialService.deletePost(postId);
              removePost(postId);
              
              // Add haptic feedback for successful action
              try {
                const { Haptics } = require('expo-haptics');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error) {
                // Haptics not available
              }
              
              Alert.alert('Sucesso', 'Post deletado com sucesso!');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Erro', 'Não foi possível deletar o post. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const handleUserPress = (userId: string) => {
    // Navegar para o perfil do usuário
    navigation.navigate('UserProfile', { userId });
  };

  const handlePostCreated = async (newPost: Post) => {
    addNewPost(newPost);
    await loadStories(); // Reload stories to get updated data
  };

  const handleStoryCreated = async (newStory: Story) => {
    setStories(prevStories => [newStory, ...prevStories]);
    setGroupedStories(groupStoriesByUser([newStory, ...stories]));
  };

  const handleStoryDeleted = async (storyId: string) => {
    try {
      await socialService.deleteStory(storyId);
      const updatedStories = stories.filter(story => story.id !== storyId);
      setStories(updatedStories);
      setGroupedStories(groupStoriesByUser(updatedStories));
    } catch (error) {
      console.error('Error deleting story:', error);
      Alert.alert('Erro', 'Não foi possível deletar o story. Tente novamente.');
    }
  };

  const handleStoryPress = (userIndex: number, userStories: Story[]) => {
    setSelectedUserStories(userStories);
    setSelectedStoryIndex(userIndex);
    setShowStoriesViewer(true);
  };

  const handleEventPress = (eventId: string) => {
    // Add haptic feedback for better UX
    try {
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, continue without it
    }
    
    navigation.navigate('EventDetails', { eventId });
  };

  const handleCommentPress = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setShowCommentsModal(true);
    }
  };

  const handleCommentAdded = useCallback((postId: string, newCommentCount: number) => {
    // Update comment count when new comment is added (Instagram-style)
    updatePostComments(postId, newCommentCount);
    
    // Update selected post as well
    setSelectedPost(prevPost => 
      prevPost && prevPost.id === postId 
        ? { 
            ...prevPost, 
            _count: { 
              ...prevPost._count, 
              comments: newCommentCount
            }
          }
        : prevPost
    );
  }, [updatePostComments]);

  const handleReportPost = useCallback(async (postId: string, reason: string) => {
    try {
      const result = await socialService.reportPost(postId, reason);
      
      // Add haptic feedback for successful report
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics not available
      }
      
      return result;
    } catch (error: any) {
      console.error('Error reporting post:', error);
      
      // Add haptic feedback for error
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (hapticError) {
        // Haptics not available
      }
      
      // Re-throw with user-friendly message
      throw new Error(error?.message || 'Erro ao enviar denúncia. Tente novamente.');
    }
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}sem`;
    
    // Para períodos mais longos, mostrar data
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const renderStoryItem = ({ item, index }: { item: GroupedStories; index: number }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => handleStoryPress(index, item.stories)}
    >
      <View style={[
        styles.storyAvatar,
        item.hasUnviewed && styles.storyAvatarUnviewed
      ]}>
        {item.user.profileImage ? (
          <Image source={{ uri: item.user.profileImage }} style={styles.storyAvatarImage} />
        ) : (
          <Ionicons name="person" size={24} color={colors.brand.textSecondary} />
        )}
      </View>
      <Text style={styles.storyText} numberOfLines={1}>
        {item.user.name.split(' ')[0]}
      </Text>
      {item.stories.length > 1 && (
        <View style={styles.storyCount}>
          <Text style={styles.storyCountText}>{item.stories.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      onLike={handleLikePost}
      onComment={handleCommentPress}
      onShare={(postId) => console.log('Share post:', postId)}
      onUserPress={handleUserPress}
      onEventPress={handleEventPress}
      onPostPress={handleCommentPress}
      onDeletePost={removePost}
      onReportPost={handleReportPost}
    />
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Comunidade</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons 
              name="search" 
              size={24} 
              color={colors.brand.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreatePost(true)}
          >
            <Ionicons 
              name="add" 
              size={24} 
              color={colors.brand.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stories</Text>
        <View style={styles.storiesContainer}>
          {/* Add Story Button */}
          {user && (
            <TouchableOpacity 
              style={styles.addStoryButton}
              onPress={() => setShowCreateStory(true)}
            >
              <View style={styles.addStoryIcon}>
                <Ionicons name="add" size={24} color={colors.brand.primary} />
              </View>
              <Text style={styles.storyText}>Seu Story</Text>
            </TouchableOpacity>
          )}
          
          {/* Stories List */}
          {groupedStories && groupedStories.map((item, index) => (
            <View key={item.user.id}>
              {renderStoryItem({ item, index })}
            </View>
          ))}
        </View>
      </View>

      {/* Posts Header */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feed da Comunidade</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
        <Text style={styles.loadingFooterText}>Carregando mais posts...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
        <LinearGradient
          colors={[colors.brand.background, colors.brand.darkGray]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={styles.loadingText}>Carregando comunidade...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient
        colors={[colors.brand.background, colors.brand.darkGray]}
        style={styles.gradient}
      >
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
              progressBackgroundColor={colors.brand.background}
              title="Puxe para atualizar"
              titleColor={colors.brand.textSecondary}
            />
          }
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={10}
          initialNumToRender={10}
          getItemLayout={undefined}
          keyboardShouldPersistTaps="handled"
        />
      </LinearGradient>

      {/* Modals */}
      {user && (
        <>
          <CreatePostModal
            visible={showCreatePost}
            onClose={() => setShowCreatePost(false)}
            onPostCreated={handlePostCreated}
            user={user}
          />
          
          <CreateStoryModal
            visible={showCreateStory}
            onClose={() => setShowCreateStory(false)}
            onStoryCreated={handleStoryCreated}
            user={user}
          />
        </>
      )}

      {stories.length > 0 && (
        <StoriesViewer
          visible={showStoriesViewer}
          onClose={() => setShowStoriesViewer(false)}
          groupedStories={groupedStories}
          initialUserIndex={selectedStoryIndex}
          currentUser={user || { id: '', name: '', profileImage: undefined }}
          onStoryDeleted={handleStoryDeleted}
        />
      )}

      {/* Comments Modal */}
      {selectedPost && (
        <CommentsModal
          visible={showCommentsModal}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          onUserPress={handleUserPress}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginTop: spacing.md,
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loadingFooterText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginLeft: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchButton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.full,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  createButton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.full,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  storiesContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  addStoryButton: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 70,
  },
  addStoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.primary,
    borderStyle: 'dashed',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 70,
    position: 'relative',
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.textSecondary,
    overflow: 'hidden',
  },
  storyAvatarUnviewed: {
    borderColor: colors.brand.primary,
    borderWidth: 3,
  },
  storyAvatarImage: {
    width: '100%',
    height: '100%',
  },
  storyText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  storyCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.brand.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.background,
  },
  storyCountText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
});

export default CommunityScreen; 