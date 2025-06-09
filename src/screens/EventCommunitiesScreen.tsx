import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, borderRadius } from '../theme';
import { EventCommunityCard, EventCommunityCardSkeleton } from '../components/ui/EventCommunityCard';
import { AvailableCommunityCard, AvailableCommunityCardSkeleton } from '../components/ui/AvailableCommunityCard';
import { eventCommunityService, EventCommunity } from '../services/eventCommunityService';
import { useAuth } from '../contexts/AuthContext';

// Atualizar os tipos de navegação se necessário
type CommunityStackParamList = {
  EventCommunities: undefined;
  EventCommunity: {
    eventId: string;
    communityName: string;
  };
};

const EventCommunitiesScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation<StackNavigationProp<CommunityStackParamList>>();
  const [communities, setCommunities] = useState<EventCommunity[]>([]);
  const [availableCommunities, setAvailableCommunities] = useState<EventCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);

  const loadCommunities = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated) return;

    try {
      const [userCommunities, available] = await Promise.all([
        eventCommunityService.getUserCommunities(forceRefresh),
        eventCommunityService.getAvailableCommunities(forceRefresh)
      ]);
      
      setCommunities(userCommunities);
      setAvailableCommunities(available);
    } catch (error: any) {
      console.error('Erro ao carregar comunidades:', error);
      // Não mostrar alert se for erro 404 (endpoint não implementado ainda)
      if (error?.response?.status !== 404) {
        Alert.alert('Erro', 'Não foi possível carregar suas comunidades.');
      }
      // Manter comunidades existentes em caso de erro
      if (!communities || communities.length === 0) {
        setCommunities([]);
      }
      if (!availableCommunities || availableCommunities.length === 0) {
        setAvailableCommunities([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, communities, availableCommunities]);

  const handleCommunityPress = (community: EventCommunity) => {
    navigation.navigate('EventCommunity', {
      eventId: community.eventId,
      communityName: community.name,
    });
  };

  const handleJoinCommunity = async (community: EventCommunity) => {
    if (!isAuthenticated) {
      Alert.alert('Login necessário', 'Faça login para entrar na comunidade.');
      return;
    }

    setJoiningCommunity(community.eventId);
    
    try {
      await eventCommunityService.joinCommunity(community.eventId);
      
      // Mover comunidade da lista disponível para a lista de participante
      setAvailableCommunities(prev => prev.filter(c => c.eventId !== community.eventId));
      setCommunities(prev => [...prev, { ...community, joinedAt: new Date().toISOString(), canJoin: false }]);
      
      Alert.alert(
        'Sucesso!', 
        `Você entrou na comunidade "${community.name}". Agora pode interagir com outros participantes!`,
        [
          {
            text: 'Ver Comunidade',
            onPress: () => handleCommunityPress(community)
          },
          { text: 'OK' }
        ]
      );
    } catch (error: any) {
      console.error('Erro ao entrar na comunidade:', error);
      
      let message = 'Não foi possível entrar na comunidade. Tente novamente.';
      if (error?.response?.status === 403) {
        message = 'Você precisa de um ingresso ativo para este evento para entrar na comunidade.';
      }
      
      Alert.alert('Erro', message);
    } finally {
      setJoiningCommunity(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCommunities(true); // Força refresh
  };

  useFocusEffect(
    useCallback(() => {
      loadCommunities();
    }, [loadCommunities])
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={80} color={colors.brand.textSecondary} />
      <Text style={styles.emptyTitle}>Nenhuma comunidade encontrada</Text>
      <Text style={styles.emptySubtitle}>
        Compre ingressos para eventos e tenha acesso às comunidades exclusivas!
      </Text>
    </View>
  );

  const renderSectionHeader = (title: string, subtitle: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <Ionicons name={icon as any} size={24} color={colors.brand.primary} />
        <View style={styles.sectionTextContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );

  const renderSkeletonLoader = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comunidades dos Eventos</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {[1, 2, 3].map((index) => (
          <EventCommunityCardSkeleton key={index} />
        ))}
      </ScrollView>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.authContainer}>
          <Ionicons name="lock-closed" size={60} color={colors.brand.textSecondary} />
          <Text style={styles.authText}>Faça login para ver suas comunidades</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return renderSkeletonLoader();
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Comunidades dos Eventos</Text>
            <Text style={styles.subtitle}>
              Conecte-se com outros participantes
            </Text>
          </View>
          
          {communities.length > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{communities.length}</Text>
                <Text style={styles.statLabel}>Comunidades</Text>
              </View>
            </View>
          )}
        </View>
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {communities.length === 0 && availableCommunities.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.content}>
            {/* Comunidades Disponíveis */}
            {availableCommunities.length > 0 && (
              <>
                {renderSectionHeader(
                  'Comunidades Disponíveis',
                  'Baseadas nos seus ingressos',
                  'add-circle'
                )}
                {availableCommunities.map((community) => (
                  <AvailableCommunityCard
                    key={community.id}
                    community={community}
                    onJoin={handleJoinCommunity}
                    isJoining={joiningCommunity === community.eventId}
                  />
                ))}
              </>
            )}

            {/* Minhas Comunidades */}
            {communities.length > 0 && (
              <>
                {renderSectionHeader(
                  'Minhas Comunidades',
                  'Comunidades que você participa',
                  'people'
                )}
                {communities.map((community) => (
                  <EventCommunityCard
                    key={community.id}
                    community={community}
                    onPress={() => handleCommunityPress(community)}
                  />
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.brand.background,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
  },
  statsContainer: {
    backgroundColor: colors.brand.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + spacing.lg,
  },
  content: {
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  authText: {
    fontSize: typography.fontSizes.lg,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default EventCommunitiesScreen; 