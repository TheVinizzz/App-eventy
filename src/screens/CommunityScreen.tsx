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
import { EventCommunityMiniCard, EventCommunityMiniCardSkeleton } from '../components/ui/EventCommunityMiniCard';
import CommunityTransition from '../components/ui/CommunityTransition';

import { colors, spacing, typography, borderRadius } from '../theme';
import socialService, { Post, Story } from '../services/socialService';
import { eventCommunityService, EventCommunity } from '../services/eventCommunityService';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';
import { useCommunity } from '../contexts/CommunityContext';
import { useEvenLove } from '../contexts/EvenLoveContextV2';
import useCacheInvalidation from '../hooks/useCacheInvalidation';

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

// EvenLove Intro Modal Component
interface EvenLoveIntroModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const EvenLoveIntroModal: React.FC<EvenLoveIntroModalProps> = ({ visible, onConfirm, onCancel }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 193, 7, 0.05)']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.modalIcon}
                >
                  <Ionicons name="heart" size={32} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.modalTitle}>Bem-vindo ao EvenLove!</Text>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                O EvenLove é uma funcionalidade especial que permite você conectar-se com outros participantes do evento de forma segura e divertida.
              </Text>

              <View style={styles.modalFeatures}>
                <View style={styles.modalFeature}>
                  <Ionicons name="people" size={20} color="#FFD700" />
                  <Text style={styles.modalFeatureText}>Encontre pessoas com interesses similares</Text>
                </View>

                <View style={styles.modalFeature}>
                  <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                  <Text style={styles.modalFeatureText}>Ambiente seguro e moderado</Text>
                </View>

                <View style={styles.modalFeature}>
                  <Ionicons name="ticket" size={20} color="#FF9800" />
                  <Text style={styles.modalFeatureText}>Apenas para participantes com ingresso</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={onCancel}>
                <Text style={styles.modalCancelText}>Agora não</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalConfirmButton} onPress={onConfirm}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.modalConfirmGradient}
                >
                  <Text style={styles.modalConfirmText}>Vamos lá!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const CommunityScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation<CommunityScreenNavigationProp>();
  const { currentCommunity, isInEventCommunity, enterEventCommunity, exitToGeneralCommunity } = useCommunity();
  const { checkEligibility } = useEvenLove();
  
  // Cache invalidation hook
  const { invalidateAfterCommunityJoin, invalidateAfterTicketPurchase } = useCacheInvalidation({
    onCommunityJoined: async () => {
      await loadEventCommunities();
    },
    onTicketPurchase: async () => {
      await loadEventCommunities();
    },
  });
  
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
  const [eventCommunities, setEventCommunities] = useState<EventCommunity[]>([]);
  const [availableCommunities, setAvailableCommunities] = useState<EventCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [joiningCommunityId, setJoiningCommunityId] = useState<string | null>(null);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [loadingCommunityPosts, setLoadingCommunityPosts] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoriesViewer, setShowStoriesViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [selectedUserStories, setSelectedUserStories] = useState<Story[]>([]);
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionCommunity, setTransitionCommunity] = useState<EventCommunity | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [evenLoveEligible, setEvenLoveEligible] = useState<{ [eventId: string]: boolean }>({});
  const [showEvenLoveModal, setShowEvenLoveModal] = useState(false);
  const [hasSeenEvenLoveIntro, setHasSeenEvenLoveIntro] = useState(false);
  const [selectedEventForEvenLove, setSelectedEventForEvenLove] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Debug: Mostrar informações do usuário logado
  useEffect(() => {
    if (user) {
      console.log('🧑‍💻 Usuário logado na CommunityScreen:');
      console.log('  ID:', user.id);
      console.log('  Nome:', user.name);
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
    }
  }, [user]);

  const loadInitialData = useCallback(async () => {
    try {
      // Load posts using the hook, stories and event communities separately
      await Promise.all([
        loadContextualPosts(),
        loadContextualStories(),
        loadEventCommunities()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [currentCommunity]);

  const loadContextualPosts = useCallback(async () => {
    if (isInEventCommunity && currentCommunity) {
      // Carregar posts específicos da comunidade do evento
      console.log('🎪 Carregando posts da comunidade do evento:', currentCommunity.event?.title);
      setLoadingCommunityPosts(true);
      try {
        const eventPosts = await eventCommunityService.getCommunityPosts(
          currentCommunity.eventId || currentCommunity.event.id,
          1,
          20,
          true // Sempre forçar refresh para posts de comunidade
        );
        console.log('📝 Posts da comunidade carregados:', eventPosts.length);
        
        // Converter para formato compatível
        const formattedPosts = eventPosts.map(post => ({
          ...post,
          author: post.author,
          _count: {
            likes: post.likesCount || 0,
            comments: post.commentsCount || 0
          },
          isLiked: post.isLiked || false
        }));
        
        setCommunityPosts(formattedPosts);
      } catch (error) {
        console.error('Error loading community posts:', error);
        setCommunityPosts([]);
      } finally {
        setLoadingCommunityPosts(false);
      }
    } else {
      // Carregar posts gerais (sem eventId específico)
      console.log('🌍 Carregando posts da comunidade geral');
      setCommunityPosts([]); // Limpar posts da comunidade
      // O loadPosts() já carrega posts gerais via hook usePosts sem eventId
      await loadPosts();
    }
  }, [isInEventCommunity, currentCommunity, loadPosts]);

  const loadContextualStories = useCallback(async () => {
    try {
      if (isInEventCommunity && currentCommunity) {
        // Carregar stories específicos da comunidade do evento
        console.log('🎪 Carregando stories da comunidade do evento:', currentCommunity.event?.title);
        const communityStories = await eventCommunityService.getCommunityStories(
          currentCommunity.eventId || currentCommunity.event.id
        );
        // Converter formato de stories da comunidade para formato geral
        const flatStories = communityStories.flatMap(group => 
          group.stories.map(story => ({
            ...story,
            expiresAt: story.createdAt, // Usar createdAt como fallback
            viewed: story.isViewed,
            _count: {
              views: story.viewsCount || 0
            }
          }))
        );
        setStories(flatStories);
        setGroupedStories(groupStoriesByUser(flatStories));
      } else {
        // Carregar stories gerais (não de eventos específicos)
        console.log('🌍 Carregando stories gerais');
        const storiesData = await socialService.getStories(1, 20);
        setStories(Array.isArray(storiesData) ? storiesData : []);
        setGroupedStories(groupStoriesByUser(Array.isArray(storiesData) ? storiesData : []));
      }
    } catch (error) {
      console.error('Error loading contextual stories:', error);
    }
  }, [isInEventCommunity, currentCommunity]);

  const loadStories = useCallback(async () => {
    try {
      const storiesData = await socialService.getStories(1, 20);
      setStories(Array.isArray(storiesData) ? storiesData : []);
      setGroupedStories(groupStoriesByUser(Array.isArray(storiesData) ? storiesData : []));
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  }, []);

  const loadEventCommunities = useCallback(async (forceRefresh: boolean = false) => {
    // Se não forçar refresh e já temos dados, não recarregar
    if (!forceRefresh && eventCommunities.length > 0) {
      return;
    }
    
    console.log('🔄 Carregando comunidades do evento...');
    setLoadingCommunities(true);
    try {
      // Carregar comunidades em paralelo
      console.log('📡 Fazendo requisições para comunidades...');
      const [communities, availableComms] = await Promise.all([
        eventCommunityService.getUserCommunities(forceRefresh),
        eventCommunityService.getAvailableCommunities(forceRefresh)
      ]);
      
      console.log('✅ Comunidades carregadas:');
      console.log('  - Minhas comunidades:', communities.length);
      console.log('  - Comunidades disponíveis:', availableComms.length);
      
      if (availableComms.length > 0) {
        console.log('🎯 Comunidades disponíveis:', availableComms.map(c => c.event?.title || c.name));
      }
      
      // Pegar apenas as primeiras 3 para mostrar preview na tela principal
      setEventCommunities(communities.slice(0, 3));
      setAvailableCommunities(availableComms.slice(0, 5)); // Mostrar até 5 comunidades disponíveis
      
      // Verificar elegibilidade do EvenLove para cada evento
      const allCommunities = [...communities, ...availableComms];
      for (const community of allCommunities) {
        if (community.event?.id) {
          await checkEvenLoveEligibility(community.event.id);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading event communities:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Em caso de erro, manter as comunidades existentes ou usar array vazio
      if (!eventCommunities || eventCommunities.length === 0) {
        setEventCommunities([]);
      }
      if (!availableCommunities || availableCommunities.length === 0) {
        setAvailableCommunities([]);
      }
    } finally {
      setLoadingCommunities(false);
    }
  }, []);

  // Recarregar dados quando muda o contexto da comunidade
  useEffect(() => {
    if (isInEventCommunity && currentCommunity) {
      console.log('🎪 Entrando na comunidade do evento:', currentCommunity.event?.title);
      // Forçar refresh dos posts da comunidade para garantir dados atualizados
      loadContextualPosts();
      loadContextualStories();
    } else if (!isInEventCommunity) {
      console.log('🌍 Voltando para comunidade geral');
      // Limpar posts da comunidade
      setCommunityPosts([]);
      loadContextualPosts();
      loadContextualStories();
    }
  }, [isInEventCommunity, currentCommunity, loadContextualPosts, loadContextualStories]);

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
      // Refresh apenas posts e stories, não as comunidades (para evitar piscamento)
      await Promise.all([
        loadContextualPosts(),
        loadContextualStories()
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  }, [loadContextualPosts, loadContextualStories]);

  // Instagram-style like handler - instant feedback
  const handleLikePost = useCallback(async (postId: string) => {
    // Add haptic feedback for instant response
    try {
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, continue without it
    }
    
    if (isInEventCommunity) {
      // Like em post de comunidade - atualização otimística local
      const post = communityPosts.find(p => p.id === postId);
      if (post) {
        const newIsLiked = !post.isLiked;
        const newLikesCount = newIsLiked ? 
          (post.likesCount || post._count?.likes || 0) + 1 : 
          Math.max(0, (post.likesCount || post._count?.likes || 0) - 1);
        
        // Atualização otimística imediata - atualizar ambas as estruturas
        setCommunityPosts(prev => prev.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                isLiked: newIsLiked, 
                likesCount: newLikesCount,
                _count: {
                  ...p._count,
                  likes: newLikesCount
                }
              }
            : p
        ));
        
        try {
          // Enviar para servidor
          await eventCommunityService.togglePostLike(postId);
        } catch (error) {
          console.error('Error toggling like:', error);
          // Reverter em caso de erro
          setCommunityPosts(prev => prev.map(p => 
            p.id === postId 
              ? { 
                  ...p, 
                  isLiked: post.isLiked, 
                  likesCount: post.likesCount || post._count?.likes || 0,
                  _count: {
                    ...p._count,
                    likes: post.likesCount || post._count?.likes || 0
                  }
                }
              : p
          ));
        }
      }
    } else {
      // Use the optimistic toggle method para posts gerais
      await togglePostLike(postId);
    }
  }, [togglePostLike, isInEventCommunity, communityPosts]);

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
    if (isInEventCommunity) {
      // Adicionar ao estado de posts da comunidade
      setCommunityPosts(prev => [newPost, ...prev]);
    } else {
      // Adicionar ao estado de posts gerais via hook
      addNewPost(newPost);
    }
    await loadStories(); // Reload stories to get updated data
  };

  const handleStoryCreated = async (newStory: Story) => {
    try {
      if (isInEventCommunity && currentCommunity) {
        // Story criado em comunidade de evento - recarregar apenas stories da comunidade
        console.log('🎪 Story criado na comunidade, recarregando stories da comunidade');
        await loadContextualStories();
      } else {
        // Story criado no feed geral - adicionar ao estado e recarregar
        console.log('🌍 Story criado no feed geral, atualizando estado');
        setStories(prevStories => [newStory, ...prevStories]);
        setGroupedStories(prevGrouped => {
          const updatedStories = [newStory, ...stories];
          return groupStoriesByUser(updatedStories);
        });
        // Recarregar para sincronizar com servidor
        await loadContextualStories();
      }
    } catch (error) {
      console.error('Error handling story created:', error);
    }
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
    console.log('🎪 Pressed event:', eventId);
    
    // Find the event community
    const eventCommunity = eventCommunities.find(c => c.eventId === eventId || c.event?.id === eventId);
    
    if (eventCommunity) {
      navigation.navigate('EventDetails', { eventId: eventCommunity.event.id });
    }
  };

  const handleEvenLove = async (eventId: string) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login necessário',
        'Você precisa estar logado para acessar o EvenLove.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Login', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    // Verificar se o EvenLove está habilitado para o evento
    if (!evenLoveEligible[eventId]) {
      Alert.alert(
        'EvenLove não habilitado',
        'O EvenLove não foi habilitado pelo organizador deste evento.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Se é a primeira vez, mostrar o modal explicativo
    if (!hasSeenEvenLoveIntro) {
      setSelectedEventForEvenLove(eventId);
      setShowEvenLoveModal(true);
      return;
    }

    // Continuar com a verificação normal
    await proceedToEvenLove(eventId);
  };

  const proceedToEvenLove = async (eventId: string) => {
    try {
      console.log('🎯 EvenLove: Iniciando verificação de elegibilidade para evento:', eventId);
      
      const eligibility = await checkEligibility(eventId);
      
      console.log('🎯 EvenLove: Resultado da verificação:', eligibility);
      
      if (eligibility.isEligible) {
        console.log('✅ EvenLove: Usuário elegível, navegando para EvenLoveEntry');
        navigation.navigate('EvenLoveEntry', { 
          eventId, 
          eventTitle: 'EvenLove' // Título obrigatório
        });
      } else {
        console.log('❌ EvenLove: Usuário não elegível:', eligibility.reason);
        Alert.alert(
          'Acesso restrito',
          eligibility.reason || 'Você precisa ter um ingresso válido para acessar o EvenLove.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Ver Evento', onPress: () => navigation.navigate('EventDetails', { eventId }) },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ EvenLove: Erro ao verificar elegibilidade:', error);
      
      // Melhor tratamento de erro baseado no tipo
      let errorTitle = 'Erro';
      let errorMessage = 'Não foi possível verificar sua elegibilidade. Tente novamente.';
      
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorTitle = 'Erro de Conexão';
        errorMessage = 'Verifique sua conexão com a internet e tente novamente.';
      } else if (error.response?.status >= 500) {
        errorTitle = 'Erro do Servidor';
        errorMessage = 'O servidor está temporariamente indisponível. Tente novamente em alguns minutos.';
      }
      
      Alert.alert(errorTitle, errorMessage, [
        { text: 'OK', style: 'default' },
        { text: 'Tentar Novamente', onPress: () => proceedToEvenLove(eventId) }
      ]);
    }
  };

  const handleEvenLoveModalConfirm = () => {
    setHasSeenEvenLoveIntro(true);
    setShowEvenLoveModal(false);
    if (selectedEventForEvenLove) {
      proceedToEvenLove(selectedEventForEvenLove);
    }
  };

  const handleEvenLoveModalCancel = () => {
    setShowEvenLoveModal(false);
    setSelectedEventForEvenLove(null);
  };

  const checkEvenLoveEligibility = async (eventId: string) => {
    try {
      console.log('🔍 CommunityScreen: Verificando elegibilidade para evento:', eventId);
      const eligibility = await checkEligibility(eventId);
      console.log('📊 CommunityScreen: Resultado da elegibilidade:', eligibility);
      setEvenLoveEligible(prev => ({ ...prev, [eventId]: eligibility.isEligible }));
    } catch (error) {
      console.error('❌ CommunityScreen: Erro ao verificar elegibilidade:', error);
      setEvenLoveEligible(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleEventCommunityPress = async (community: EventCommunity) => {
    // Mostrar transição
    setTransitionCommunity(community);
    setShowTransition(true);
    setLoadingProgress(0);

    try {
      // Entrar na comunidade
      enterEventCommunity(community);
      setLoadingProgress(0.2);

      // Simular carregamento progressivo
      setTimeout(() => setLoadingProgress(0.5), 500);
      
      // Carregar dados
      await Promise.all([
        loadContextualPosts(),
        loadContextualStories()
      ]);
      
      setLoadingProgress(0.8);
      
      // Finalizar
      setTimeout(() => setLoadingProgress(1), 300);
    } catch (error) {
      console.error('Error entering community:', error);
      setShowTransition(false);
      setTransitionCommunity(null);
    }
  };

  const handleViewAllCommunitiesPress = () => {
    navigation.navigate('EventCommunities');
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    setTransitionCommunity(null);
    setLoadingProgress(0);
  };

  const handleJoinEventCommunity = useCallback(async (community: EventCommunity) => {
    setJoiningCommunityId(community.id);
    
    try {
      // Usar eventId ao invés de community.id
      await eventCommunityService.joinCommunity(community.eventId || community.event.id);
      
      // Feedback haptic
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics não disponível
      }
      
      // Atualizar listas - remover da disponível e adicionar na minha
      setAvailableCommunities(prev => prev.filter(c => c.id !== community.id));
      setEventCommunities(prev => [...prev, { ...community, canJoin: false }]);
      
      // 🚀 Invalidar cache de comunidades
      await invalidateAfterCommunityJoin();
      
      // Ir direto para a comunidade do evento
      handleEventCommunityPress(community);
      
    } catch (error: any) {
      console.error('Error joining community:', error);
      
      let errorMessage = 'Não foi possível entrar na comunidade.';
      let errorDetails = '';
      
      if (error.response?.status === 403) {
        errorMessage = 'Acesso negado';
        errorDetails = 'Você precisa ter um ingresso ativo para este evento.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Comunidade não encontrada';
        errorDetails = 'Esta comunidade pode não existir ainda.';
      } else if (error.response?.data?.message) {
        errorMessage = 'Erro no servidor';
        errorDetails = error.response.data.message;
      }
      
      Alert.alert(
        errorMessage,
        errorDetails || 'Tente novamente mais tarde.',
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Ver meus ingressos',
            onPress: () => navigation.navigate('Tickets')
          }
        ]
      );
    } finally {
      setJoiningCommunityId(null);
    }
  }, [navigation]);

  const handleCommentPress = (postId: string) => {
    // Procurar o post tanto nos posts gerais quanto nos da comunidade
    let post = posts.find(p => p.id === postId);
    if (!post && isInEventCommunity) {
      post = communityPosts.find(p => p.id === postId);
    }
    
    if (post) {
      setSelectedPost(post);
      setShowCommentsModal(true);
    }
  };

  const handleCommentAdded = useCallback((postId: string, newCommentCount: number) => {
    if (isInEventCommunity) {
      // Atualizar posts da comunidade - atualizar ambas as estruturas
      setCommunityPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              commentsCount: newCommentCount,
              _count: {
                ...post._count,
                comments: newCommentCount
              }
            }
          : post
      ));
    } else {
      // Update comment count for general posts (Instagram-style)
      updatePostComments(postId, newCommentCount);
    }
    
    // Update selected post as well
    setSelectedPost(prevPost => 
      prevPost && prevPost.id === postId 
        ? { 
            ...prevPost, 
            _count: { 
              ...prevPost._count, 
              comments: newCommentCount
            },
            commentsCount: newCommentCount
          }
        : prevPost
    );
  }, [updatePostComments, isInEventCommunity]);

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
        <View style={styles.headerLeft}>
          {isInEventCommunity && (
                         <TouchableOpacity 
               style={styles.backButton}
               onPress={exitToGeneralCommunity}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={colors.brand.primary} 
              />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {isInEventCommunity ? currentCommunity?.event?.title || 'Evento' : 'Comunidade'}
            </Text>
            {isInEventCommunity && (
              <Text style={styles.subtitle}>Comunidade do Evento</Text>
            )}
          </View>
        </View>
        
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
          {/* Botão de criar posts disponível em ambos contextos */}
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

      {/* Event Features Section - só mostrar dentro de comunidades de evento */}
      {isInEventCommunity && currentCommunity && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features do Evento</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventFeaturesContainer}
          >
            {/* EvenLove Feature - Design Simples */}
            <TouchableOpacity 
              style={styles.evenLoveSimpleCard}
              onPress={() => handleEvenLove(currentCommunity.eventId || currentCommunity.event.id)}
              activeOpacity={0.8}
            >
              <View style={styles.evenLoveSimpleContainer}>
                <View style={[
                  styles.evenLoveCircle,
                  !evenLoveEligible[currentCommunity.eventId || currentCommunity.event.id] && styles.evenLoveCircleDisabled
                ]}>
                  <LinearGradient
                    colors={evenLoveEligible[currentCommunity.eventId || currentCommunity.event.id]
                      ? ['#FFD700', '#FFA500']
                      : ['rgba(150, 150, 150, 0.8)', 'rgba(120, 120, 120, 0.6)']}
                    style={styles.evenLoveCircleGradient}
                  >
                    <Ionicons 
                      name="heart" 
                      size={24} 
                      color={evenLoveEligible[currentCommunity.eventId || currentCommunity.event.id] ? "white" : "rgba(255, 255, 255, 0.7)"} 
                    />
                  </LinearGradient>
                  
                  {!evenLoveEligible[currentCommunity.eventId || currentCommunity.event.id] && (
                    <View style={styles.evenLoveLockOverlay}>
                      <Ionicons name="lock-closed" size={16} color="rgba(255, 255, 255, 0.9)" />
                    </View>
                  )}
                </View>
                
                <Text style={[
                  styles.evenLoveSimpleTitle,
                  !evenLoveEligible[currentCommunity.eventId || currentCommunity.event.id] && styles.evenLoveSimpleTitleDisabled
                ]}>
                  EvenLove
                </Text>
              </View>
            </TouchableOpacity>


          </ScrollView>
        </View>
      )}

      {/* Stories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stories</Text>
        <View style={styles.storiesContainer}>
          {/* Add Story Button - disponível em ambos contextos */}
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

      {/* Communities Section - só mostrar na comunidade geral */}
      {!isInEventCommunity && (
        <View style={styles.section}>
          {/* Header de Comunidades */}
          <View style={styles.sectionHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.communitiesTitle}>Comunidades</Text>
              <Text style={styles.communitiesSubtitle}>Conecte-se com outros usuários</Text>
            </View>
            
            {(eventCommunities.length > 0 || availableCommunities.length > 0) && (
              <TouchableOpacity onPress={handleViewAllCommunitiesPress}>
                <Text style={styles.viewAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>
          
                    <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.miniCardsContainer}
          >
            {/* Available Communities */}
            {loadingCommunities ? (
              <>
                {[1, 2, 3].map((index) => (
                  <EventCommunityMiniCardSkeleton key={index} />
                ))}
              </>
            ) : (
              <>
                {availableCommunities.map((community) => (
                  <EventCommunityMiniCard
                    key={community.id}
                    community={{ ...community, canJoin: true }}
                    onPress={handleJoinEventCommunity}
                    isJoining={joiningCommunityId === community.id}
                    variant="event"
                  />
                ))}

                {/* My Communities */}
                {eventCommunities.map((community) => (
                  <EventCommunityMiniCard
                    key={community.id}
                    community={{ ...community, canJoin: false }}
                    onPress={handleEventCommunityPress}
                    variant="event"
                  />
                ))}
              </>
            )}
          </ScrollView>
        </View>
      )}

      {/* Posts Header */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isInEventCommunity 
            ? `Posts da Comunidade - ${currentCommunity?.event?.title}` 
            : 'Feed da Comunidade Geral'
          }
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (!isInEventCommunity) return null;
    
    return (
      <View style={styles.emptyStateContainer}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
          style={styles.emptyStateCard}
        >
          <View style={styles.emptyStateIconContainer}>
            <Ionicons name="people" size={48} color="#FFD700" />
            <View style={styles.emptyStateIconBadge}>
              <Ionicons name="ticket" size={16} color={colors.brand.background} />
            </View>
          </View>
          
          <Text style={styles.emptyStateTitle}>
            Esta comunidade está esperando você!
          </Text>
          
          <Text style={styles.emptyStateDescription}>
            Seja o primeiro a compartilhar algo especial com outros participantes do{' '}
            <Text style={styles.emptyStateEventName}>
              {currentCommunity?.event?.title}
            </Text>
          </Text>
          
          <View style={styles.emptyStatePrivacyInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#FFD700" />
            <Text style={styles.emptyStatePrivacyText}>
              Apenas participantes com ingresso podem ver e interagir
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => setShowCreatePost(true)}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.emptyStateButtonGradient}
            >
              <Ionicons name="add" size={24} color={colors.brand.background} />
              <Text style={styles.emptyStateButtonText}>Criar primeira postagem</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
        <Text style={styles.loadingFooterText}>Carregando mais posts...</Text>
      </View>
    );
  };

  if (loading && !isInEventCommunity) {
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
          data={isInEventCommunity ? communityPosts : posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isInEventCommunity ? loadingCommunityPosts : refreshing}
              onRefresh={isInEventCommunity ? loadContextualPosts : handleRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
              progressBackgroundColor={colors.brand.background}
              title="Puxe para atualizar"
              titleColor={colors.brand.textSecondary}
            />
          }
          onEndReached={isInEventCommunity ? undefined : loadMorePosts}
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
            isEventCommunity={isInEventCommunity}
            eventInfo={currentCommunity ? {
              title: currentCommunity.event.title,
              id: currentCommunity.eventId || currentCommunity.event.id
            } : undefined}
          />
          
          <CreateStoryModal
            visible={showCreateStory}
            onClose={() => setShowCreateStory(false)}
            onStoryCreated={handleStoryCreated}
            user={user}
            isEventCommunity={isInEventCommunity}
            eventInfo={currentCommunity ? {
              title: currentCommunity.event.title,
              id: currentCommunity.eventId || currentCommunity.event.id
            } : undefined}
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
          isEventCommunity={isInEventCommunity}
          eventId={currentCommunity?.eventId || currentCommunity?.event?.id}
        />
      )}

      {/* Community Transition */}
      <CommunityTransition
        visible={showTransition}
        community={transitionCommunity}
        onComplete={handleTransitionComplete}
        loadingProgress={loadingProgress}
      />

      {/* EvenLove Intro Modal */}
      <EvenLoveIntroModal
        visible={showEvenLoveModal}
        onConfirm={handleEvenLoveModalConfirm}
        onCancel={handleEvenLoveModalCancel}
      />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    marginRight: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
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
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  communitiesTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  communitiesSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
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
  // Event Communities Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  titleSection: {
    flex: 1,
  },
  sectionHeaderVertical: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  communitiesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  miniCardsContainer: {
    paddingHorizontal: spacing.lg,
  },
  communityPreviewCard: {
    width: 120,
    backgroundColor: colors.brand.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  communityImageContainer: {
    position: 'relative',
    height: 80,
  },
  communityImage: {
    width: '100%',
    height: '100%',
  },
  communityImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  communityBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  communityBadgeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  communityInfo: {
    padding: spacing.sm,
  },
  communityTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: 2,
  },
  communitySubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
  },
  // Empty State Styles
  emptyStateContainer: {
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  emptyStateCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  emptyStateIconContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  emptyStateIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.background,
  },
  emptyStateTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyStateDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  emptyStateEventName: {
    color: '#FFD700',
    fontWeight: typography.fontWeights.semibold,
  },
  emptyStatePrivacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyStatePrivacyText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  emptyStateButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  emptyStateButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },

  // Event Features Styles
  eventFeaturesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  
  // EvenLove Card - Design Simples
  evenLoveSimpleCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  evenLoveSimpleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  evenLoveCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'relative',
    marginBottom: spacing.sm,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  evenLoveCircleDisabled: {
    shadowColor: '#999',
    shadowOpacity: 0.2,
  },
  evenLoveCircleGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  evenLoveLockOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.background,
  },
  evenLoveSimpleTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
  },
  evenLoveSimpleTitleDisabled: {
    color: colors.brand.textSecondary,
    opacity: 0.7,
  },

  // EvenLove Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalGradient: {
    padding: spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalIconContainer: {
    marginBottom: spacing.lg,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: spacing.xl,
  },
  modalDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalFeatures: {
    gap: spacing.lg,
  },
  modalFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalFeatureText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.brand.textSecondary,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalConfirmGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
});

export default CommunityScreen; 