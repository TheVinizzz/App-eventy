import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import socialService, { UserProfile, UserPost, UserEvent } from '../services/socialService';
import PostModal from '../components/social/PostModal';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - spacing.lg * 2 - spacing.md * 2) / 3;

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<UserProfileScreenNavigationProp>();
  const route = useRoute<UserProfileScreenRouteProp>();
  const { user: currentUser } = useAuth();
  
  const userId = route.params?.userId;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'events'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Carregar dados do perfil, posts e eventos em paralelo
      const [profileData, postsData, eventsData] = await Promise.all([
        socialService.getUserProfile(userId),
        socialService.getUserPosts(userId, 1, 20),
        socialService.getUserEvents(userId, undefined, 1, 20),
      ]);


      
      setUserProfile(profileData);
      setPosts(postsData?.posts || []);
      setEvents(eventsData?.events || []);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil do usuário. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserProfile();
    setIsRefreshing(false);
  };

  const handleFollowToggle = async () => {
    if (!userProfile) return;
    
    try {
      setIsFollowLoading(true);
      
      // Toggle do estado local imediatamente para melhor UX
      const optimisticState = !userProfile.isFollowing;
      const optimisticCount = userProfile.isFollowing 
        ? userProfile.followersCount - 1 
        : userProfile.followersCount + 1;
      
      setUserProfile({
        ...userProfile,
        isFollowing: optimisticState,
        followersCount: optimisticCount,
      });
      
      let result;
      if (userProfile.isFollowing) {
        result = await socialService.unfollowUser(userId);
      } else {
        result = await socialService.followUser(userId);
      }
      
      // Atualizar com o resultado real do servidor
      setUserProfile(prev => ({
        ...prev!,
        isFollowing: result.isFollowing,
        followersCount: result.followersCount,
      }));
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      
      // Reverter o estado otimista em caso de erro
      setUserProfile(prev => ({
        ...prev!,
        isFollowing: !userProfile.isFollowing,
        followersCount: userProfile.isFollowing 
          ? userProfile.followersCount + 1 
          : userProfile.followersCount - 1,
      }));
      
      Alert.alert('Erro', 'Não foi possível atualizar o status de seguidor. Tente novamente.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessageUser = () => {
    // TODO: Navigate to chat/message screen
    Alert.alert('Mensagem', 'Funcionalidade de mensagens em desenvolvimento');
  };

  const handleSocialLink = (platform: string, username?: string) => {
    if (!username) return;
    
    // TODO: Open social media app or browser
    Alert.alert('Link Social', `Abrindo ${platform}: ${username}`);
  };

  const renderPostItem = ({ item }: { item: UserPost }) => {
    // Fallback para posts sem imagem
    const hasImage = item.imageUrl && item.imageUrl.trim() !== '';
    
    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => {
          setSelectedPostId(item.id);
          setShowPostModal(true);
        }}
      >
        {hasImage ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.gridImage}
            // defaultSource={require('../../assets/placeholder-image.png')}
            onError={() => console.log('Error loading image:', item.imageUrl)}
          />
        ) : (
          <View style={styles.gridPlaceholder}>
            <View style={styles.gridPlaceholderIcon}>
              <Ionicons name="document-text" size={32} color={colors.brand.textSecondary} />
            </View>
            <Text style={styles.gridPlaceholderText} numberOfLines={3}>
              {item.content || 'Post sem conteúdo'}
            </Text>
          </View>
        )}
        
        <View style={styles.gridOverlay}>
          <View style={styles.gridStats}>
            <View style={styles.gridStat}>
              <Ionicons name="heart" size={16} color="white" />
              <Text style={styles.gridStatText}>{item.likesCount || 0}</Text>
            </View>
            <View style={styles.gridStat}>
              <Ionicons name="chatbubble" size={16} color="white" />
              <Text style={styles.gridStatText}>{item.commentsCount || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventItem = ({ item }: { item: UserEvent }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => {
        navigation.navigate('EventDetails', { eventId: item.id });
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
      <View style={styles.eventInfo}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.eventTypeBadge, { 
            backgroundColor: item.type === 'created' ? colors.brand.primary : colors.brand.success 
          }]}>
            <Text style={styles.eventTypeText}>
              {item.type === 'created' ? 'Criado' : 'Participou'}
            </Text>
          </View>
        </View>
        <Text style={styles.eventVenue}>{item.venue?.name || 'Local não informado'}</Text>
        <Text style={styles.eventDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
      </View>
    </TouchableOpacity>
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.brand.background, colors.brand.darkGray]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando perfil...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.brand.background, colors.brand.darkGray]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Usuário não encontrado</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient colors={[colors.brand.background, colors.brand.darkGray]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{userProfile.name}</Text>
          
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.brand.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                {userProfile.profileImage ? (
                  <Image source={{ uri: userProfile.profileImage }} style={styles.profileImageImg} />
                ) : (
                  <Text style={styles.profileImageText}>{getInitials(userProfile.name)}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.profileStats}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile.postsCount || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile.followersCount || 0}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile.followingCount || 0}</Text>
                <Text style={styles.statLabel}>Seguindo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            {userProfile.bio && (
              <Text style={styles.profileBio}>{userProfile.bio}</Text>
            )}
            
            {/* Social Links */}
            {(userProfile.instagram || userProfile.tiktok || userProfile.facebook) && (
              <View style={styles.socialLinks}>
                {userProfile.instagram && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => handleSocialLink('Instagram', userProfile.instagram)}
                  >
                    <Ionicons name="logo-instagram" size={20} color={colors.brand.primary} />
                    <Text style={styles.socialLinkText}>{userProfile.instagram}</Text>
                  </TouchableOpacity>
                )}
                {userProfile.tiktok && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => handleSocialLink('TikTok', userProfile.tiktok)}
                  >
                    <Ionicons name="logo-tiktok" size={20} color={colors.brand.primary} />
                    <Text style={styles.socialLinkText}>{userProfile.tiktok}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {currentUser?.id !== userProfile.id && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.followButton, 
                  userProfile.isFollowing && styles.followingButton]}
                onPress={handleFollowToggle}
                disabled={isFollowLoading}
              >
                <Text style={[styles.actionButtonText, 
                  userProfile.isFollowing && styles.followingButtonText]}>
                  {userProfile.isFollowing ? 'Seguindo' : 'Seguir'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.messageButton]}
                onPress={handleMessageUser}
              >
                <Text style={styles.messageButtonText}>Mensagem</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Ionicons 
                name="grid-outline" 
                size={24} 
                color={activeTab === 'posts' ? colors.brand.primary : colors.brand.textSecondary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'events' && styles.activeTab]}
              onPress={() => setActiveTab('events')}
            >
              <Ionicons 
                name="calendar-outline" 
                size={24} 
                color={activeTab === 'events' ? colors.brand.primary : colors.brand.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'posts' ? (
              posts && posts.length > 0 ? (
                <FlatList
                  data={posts}
                  renderItem={renderPostItem}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  scrollEnabled={false}
                  contentContainerStyle={styles.gridContainer}
                  columnWrapperStyle={styles.gridRow}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="grid-outline" size={64} color={colors.brand.textSecondary} />
                  <Text style={styles.emptyStateTitle}>Nenhum post ainda</Text>
                  <Text style={styles.emptyStateText}>
                    {currentUser?.id === userProfile.id 
                      ? 'Compartilhe momentos dos seus eventos favoritos!'
                      : 'Este usuário ainda não fez nenhuma publicação.'
                    }
                  </Text>
                </View>
              )
            ) : (
              events && events.length > 0 ? (
                <FlatList
                  data={events}
                  renderItem={renderEventItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.eventsContainer}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={64} color={colors.brand.textSecondary} />
                  <Text style={styles.emptyStateTitle}>Nenhum evento ainda</Text>
                  <Text style={styles.emptyStateText}>
                    {currentUser?.id === userProfile.id 
                      ? 'Participe de eventos ou crie seus próprios!'
                      : 'Este usuário ainda não participou de eventos.'
                    }
                  </Text>
                </View>
              )
            )}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Post Modal */}
      {selectedPostId && (
        <PostModal
          visible={showPostModal}
          onClose={() => {
            setShowPostModal(false);
            setSelectedPostId(null);
          }}
          postId={selectedPostId}
          onLike={(postId) => {
            // Update the post in the local state
            setPosts(prevPosts => 
              prevPosts.map(post => 
                post.id === postId 
                  ? { ...post, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 }
                  : post
              )
            );
          }}
          onUserPress={(userId) => {
            setShowPostModal(false);
            setSelectedPostId(null);
            if (userId !== userProfile?.id) {
              navigation.navigate('UserProfile', { userId });
            }
          }}
          onEventPress={(eventId) => {
            setShowPostModal(false);
            setSelectedPostId(null);
            navigation.navigate('EventDetails', { eventId });
          }}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSizes.lg,
    color: colors.brand.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.textSecondary + '20',
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  moreButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  profileImageContainer: {
    marginRight: spacing.xl,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.brand.primary,
  },
  profileImageImg: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  profileImageText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  profileStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
  },
  profileInfo: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  profileBio: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  socialLinks: {
    marginTop: spacing.sm,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  socialLinkText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    marginLeft: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: colors.brand.primary,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  actionButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  followingButtonText: {
    color: colors.brand.primary,
  },
  messageButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brand.textSecondary,
  },
  messageButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.textSecondary + '20',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.brand.primary,
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  gridContainer: {
    paddingHorizontal: spacing.lg,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  gridStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridStatText: {
    color: 'white',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  gridPlaceholderIcon: {
    marginBottom: spacing.xs,
  },
  gridPlaceholderText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  eventsContainer: {
    paddingHorizontal: spacing.lg,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  eventImage: {
    width: 80,
    height: 80,
  },
  eventInfo: {
    flex: 1,
    padding: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  eventTitle: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginRight: spacing.sm,
  },
  eventTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  eventTypeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.background,
  },
  eventVenue: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UserProfileScreen; 