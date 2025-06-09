import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { EventCard, NearbyEventsSkeleton } from '../components/ui';
import FeaturedEvents, { FeaturedEventsRef } from '../components/FeaturedEvents';
import TrendingEvents from '../components/TrendingEvents';
import AuthModal from '../components/AuthModal';
import { fetchNearbyEvents, Event } from '../services/eventsService';
import { useApiData } from '../hooks/useApiData';
import { getCacheConfig } from '../config/performance';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  requiresAuth: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const featuredEventsRef = useRef<FeaturedEventsRef>(null);

  // Use the new caching system for nearby events
  const {
    data: nearbyEvents,
    loading: nearbyLoading,
    error: nearbyError,
    refresh: refreshNearby,
    isRefreshing: isRefreshingNearby,
  } = useApiData(
    () => fetchNearbyEvents(8),
    {
      cacheKey: 'nearby_events',
      ...getCacheConfig('nearbyEvents'),
      refetchOnMount: true,
    }
  );

  const categories = [
    { id: 'all', name: 'Todos', icon: 'apps' },
    { id: 'music', name: 'Música', icon: 'musical-notes' },
    { id: 'sports', name: 'Esportes', icon: 'football' },
    { id: 'tech', name: 'Tech', icon: 'laptop' },
    { id: 'food', name: 'Food', icon: 'restaurant' },
    { id: 'art', name: 'Arte', icon: 'color-palette' },
  ];

  const quickActions = [
    {
      id: '1',
      title: 'Meus Ingressos',
      icon: 'ticket',
      color: colors.brand.primary,
      requiresAuth: true,
    },
    {
      id: '2',
      title: 'Favoritos',
      icon: 'heart',
      color: '#FF6B6B',
      requiresAuth: true,
    },
    {
      id: '3',
      title: 'Criar Evento',
      icon: 'add-circle',
      color: '#4ECDC4',
      requiresAuth: true,
    },
    {
      id: '4',
      title: 'Explorar',
      icon: 'compass',
      color: '#45B7D1',
      requiresAuth: false,
    },
  ];

  const forceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshNearby();
    setIsRefreshing(false);
  }, [refreshNearby]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshNearby();
    } catch (error) {
      console.error('Error refreshing home data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshNearby]);



  const handleQuickAction = (action: QuickAction) => {
    // Verificar autenticação para ações que requerem login
    if (action.requiresAuth && !isAuthenticated) {
      setAuthModalVisible(true);
      return;
    }

    switch (action.id) {
      case '1': // Meus Ingressos
        navigation.navigate('Tickets');
        break;
      case '2': // Favoritos
        navigation.navigate('Favorites');
        break;
      case '3': // Criar Evento
        navigation.navigate('CreateEvent');
        break;
      case '4': // Explorar
        navigation.navigate('Search');
        break;
      default:
        break;
    }
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  const handleTrendingEventPress = (eventId: string) => {
    navigation.navigate('EventDetails', { eventId });
  };

  const handleFilterPress = () => {
    navigation.navigate('Search', {
      openFilters: true,
    });
  };



  const renderQuickAction = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.quickActionItem}
      onPress={() => handleQuickAction(item)}
    >
      <LinearGradient
        colors={[item.color, `${item.color}CC`]}
        style={styles.quickActionGradient}
      >
        <Ionicons name={item.icon} size={28} color={colors.brand.background} />
      </LinearGradient>
      <Text style={styles.quickActionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderNearbyEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.nearbyEventCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.9}
    >
      {/* Event Image with Overlay */}
      <View style={styles.nearbyEventImageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.nearbyEventImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.nearbyEventImageOverlay}
        />
        
        {/* Price Badge */}
        <View style={styles.nearbyEventPriceBadge}>
          <Text style={styles.nearbyEventPriceText}>
            {formatPrice(item.lowestPrice)}
          </Text>
        </View>
      </View>
      
      {/* Event Content */}
      <View style={styles.nearbyEventContent}>
        {/* Header with Title and Attendees */}
        <View style={styles.nearbyEventHeader}>
          <Text style={styles.nearbyEventTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          {item.attendeesCount && item.attendeesCount > 0 && (
            <View style={styles.nearbyEventAttendeesContainer}>
              <View style={styles.nearbyEventAttendeesIcon}>
                <Ionicons name="people" size={12} color={colors.brand.background} />
              </View>
              <Text style={styles.nearbyEventAttendeesText}>
                {formatAttendees(item.attendeesCount)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Location */}
        <View style={styles.nearbyEventLocationContainer}>
          <Ionicons name="location" size={14} color={colors.brand.primary} />
          <Text style={styles.nearbyEventLocationText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        
        {/* Date and Time Row */}
        <View style={styles.nearbyEventDateTimeContainer}>
          <View style={styles.nearbyEventDateContainer}>
            <View style={styles.nearbyEventDateIcon}>
              <Ionicons name="calendar" size={12} color={colors.brand.background} />
            </View>
            <Text style={styles.nearbyEventDateText}>
              {formatEventDate(item.date)}
            </Text>
          </View>
        </View>
        
        {/* Time Row */}
        <View style={styles.nearbyEventTimeRow}>
          <View style={styles.nearbyEventTimeContainer}>
            <View style={styles.nearbyEventTimeIcon}>
              <Ionicons name="time" size={12} color={colors.brand.background} />
            </View>
            <Text style={styles.nearbyEventTimeText}>
              {formatEventTime(item.date)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Gratuito';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const formatAttendees = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const renderNearbyEventsSection = () => {
    // Show skeleton while loading
    if (nearbyLoading && !nearbyEvents) {
      return <NearbyEventsSkeleton count={3} />;
    }

    if (nearbyError && !nearbyEvents) {
      return (
        <View style={styles.errorSection}>
          <Ionicons name="alert-circle" size={24} color={colors.brand.textSecondary} />
          <Text style={styles.errorText}>Erro ao carregar eventos próximos</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshNearby}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!nearbyEvents || nearbyEvents.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="location-outline" size={24} color={colors.brand.textSecondary} />
          <Text style={styles.emptyText}>Nenhum evento próximo encontrado</Text>
        </View>
      );
    }

    return (
      <View style={styles.nearbyEventsContainer}>
        {nearbyEvents.slice(0, 4).map((event) => (
          <View key={event.id} style={styles.nearbyEventWrapper}>
            {renderNearbyEvent({ item: event })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        directionalLockEnabled={true}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isRefreshingNearby}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
            title="Atualizando eventos..."
            titleColor={colors.brand.textSecondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>
                {isAuthenticated ? `Olá, ${String(user?.name?.split(' ')[0] || 'usuário')}!` : 'Olá!'}
              </Text>
              <Text style={styles.subGreeting}>Descubra eventos incríveis</Text>
            </View>
            
            {!isAuthenticated && (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => setAuthModalVisible(true)}
              >
                <LinearGradient
                  colors={[colors.brand.primary, colors.brand.secondary]}
                  style={styles.loginGradient}
                >
                  <Ionicons name="person" size={20} color={colors.brand.background} />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TouchableOpacity 
              style={styles.searchBar} 
              onPress={() => navigation.navigate('Search', { autoFocus: true })}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={20} color={colors.brand.textSecondary} />
              <Text style={styles.searchInput}>
                Buscar eventos...
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
              <Ionicons name="options" size={20} color={colors.brand.primary} />
            </TouchableOpacity>
          </View>
        </View>



        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flash" size={20} color={colors.brand.primary} />
              <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            </View>
          </View>
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
            bounces={false}
            alwaysBounceVertical={false}
            alwaysBounceHorizontal={true}
            directionalLockEnabled={true}
          />
        </View>

        {/* Featured Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flame" size={20} color={colors.brand.primary} />
              <Text style={styles.sectionTitle}>Em Destaque</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Search', { 
              filters: { type: 'featured' } 
            })}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FeaturedEvents ref={featuredEventsRef} onEventPress={handleEventPress} />
        </View>

        {/* Nearby Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="location" size={20} color={colors.brand.primary} />
              <Text style={styles.sectionTitle}>Eventos Próximos</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Search', { 
              filters: { type: 'nearby' } 
            })}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {renderNearbyEventsSection()}
        </View>

        {/* Stories Section - Instagram Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="play-circle" size={20} color={colors.brand.primary} />
              <Text style={styles.sectionTitle}>Stories dos Eventos</Text>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.storiesContainer}
            bounces={false}
            alwaysBounceVertical={false}
            alwaysBounceHorizontal={true}
            directionalLockEnabled={true}
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <TouchableOpacity key={item} style={styles.storyItem}>
                <LinearGradient
                  colors={[colors.brand.primary, colors.brand.secondary, '#FF6B6B']}
                  style={styles.storyGradient}
                >
                  <View style={styles.storyImageContainer}>
                    <Image
                      source={{ uri: `https://picsum.photos/80/80?random=${item}` }}
                      style={styles.storyImage}
                    />
                  </View>
                </LinearGradient>
                <Text style={styles.storyLabel} numberOfLines={1}>
                  {item === 1 ? 'Rock Festival' : item === 2 ? 'Tech Summit' : item === 3 ? 'Food Fest' : item === 4 ? 'Art Show' : item === 5 ? 'Music Live' : 'Comedy'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Now - TikTok Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="trending-up" size={20} color={colors.brand.primary} />
              <Text style={styles.sectionTitle}>Trending Agora</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver mais</Text>
            </TouchableOpacity>
          </View>
          
          <TrendingEvents 
            limit={5}
            onEventPress={handleTrendingEventPress}
          />
        </View>

        {/* Quick Discover - Facebook Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="compass" size={20} color={colors.brand.primary} />
              <Text style={styles.sectionTitle}>Descubra Rápido</Text>
            </View>
          </View>
          
          <View style={styles.quickDiscoverContainer}>
            <View style={styles.quickDiscoverRow}>
              <TouchableOpacity 
                style={[styles.quickDiscoverCard, styles.quickDiscoverLarge]}
                onPress={() => navigation.navigate('Search', { type: 'SHOW' })}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.quickDiscoverGradient}
                >
                  <Ionicons name="musical-notes" size={32} color={colors.brand.background} />
                  <Text style={styles.quickDiscoverTitle}>Shows & Festivais</Text>
                  <Text style={styles.quickDiscoverSubtitle}>120+ eventos</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.quickDiscoverColumn}>
                <TouchableOpacity 
                  style={[styles.quickDiscoverCard, styles.quickDiscoverSmall]}
                  onPress={() => navigation.navigate('Search', { type: 'NORMAL', query: 'food' })}
                >
                  <LinearGradient
                    colors={['#4ECDC4', '#44A08D']}
                    style={styles.quickDiscoverGradient}
                  >
                    <Ionicons name="restaurant" size={24} color={colors.brand.background} />
                    <Text style={styles.quickDiscoverSmallTitle}>Food</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.quickDiscoverCard, styles.quickDiscoverSmall]}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.quickDiscoverGradient}
                  >
                    <Ionicons name="laptop" size={24} color={colors.brand.background} />
                    <Text style={styles.quickDiscoverSmallTitle}>Tech</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.quickDiscoverRow}>
              <TouchableOpacity style={[styles.quickDiscoverCard, styles.quickDiscoverMedium]}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  style={styles.quickDiscoverGradient}
                >
                  <Ionicons name="color-palette" size={28} color={colors.brand.background} />
                  <Text style={styles.quickDiscoverMediumTitle}>Arte & Cultura</Text>
                  <Text style={styles.quickDiscoverSubtitle}>85+ eventos</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.quickDiscoverCard, styles.quickDiscoverMedium]}>
                <LinearGradient
                  colors={['#ffecd2', '#fcb69f']}
                  style={styles.quickDiscoverGradient}
                >
                  <Ionicons name="football" size={28} color={colors.brand.background} />
                  <Text style={styles.quickDiscoverMediumTitle}>Esportes</Text>
                  <Text style={styles.quickDiscoverSubtitle}>45+ eventos</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        initialMode="login"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  subGreeting: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
  },
  loginButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  loginGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  filterButton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  seeAllText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },

  quickActionsContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  quickActionItem: {
    alignItems: 'center',
    width: 90,
  },
  quickActionGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickActionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    fontWeight: typography.fontWeights.medium,
    lineHeight: typography.fontSizes.sm * 1.3,
  },
  eventsContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  eventCard: {
    width: 300,
  },
  errorSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.background,
  },
  emptySection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statsTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    fontWeight: typography.fontWeights.medium,
  },
  bottomSpacing: {
    height: spacing.xxxl * 2,
  },
  nearbyEventCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 0,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.darkGray,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    height: 140,
  },
  nearbyEventImageContainer: {
    position: 'relative',
    width: 140,
    height: '100%',
  },
  nearbyEventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nearbyEventImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  nearbyEventPriceBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.primary,
    elevation: 4,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  nearbyEventPriceText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  nearbyEventContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    height: '100%',
  },
  nearbyEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  nearbyEventTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    lineHeight: typography.fontSizes.md * 1.2,
    flex: 1,
    marginRight: spacing.sm,
    minHeight: typography.fontSizes.md * 1.2 * 2,
  },
  nearbyEventAttendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  nearbyEventAttendeesIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyEventAttendeesText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  nearbyEventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  nearbyEventLocationText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    flex: 1,
    fontWeight: typography.fontWeights.medium,
  },
  nearbyEventDateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nearbyEventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  nearbyEventDateIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyEventDateText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  nearbyEventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nearbyEventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  nearbyEventTimeIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyEventTimeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  nearbyEventsContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  nearbyEventWrapper: {
    marginBottom: spacing.xxxs,
  },
  storiesContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    width: 80,
  },
  storyGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  storyImageContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    overflow: 'hidden',
    backgroundColor: colors.brand.background,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyLabel: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
    width: 80,
  },
  quickDiscoverContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  quickDiscoverRow: {
    flexDirection: 'row',
    gap: spacing.md,
    height: 120,
  },
  quickDiscoverCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  quickDiscoverLarge: {
    flex: 2,
  },
  quickDiscoverMedium: {
    flex: 1,
  },
  quickDiscoverSmall: {
    height: 56,
  },
  quickDiscoverColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  quickDiscoverGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  quickDiscoverTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  quickDiscoverSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  quickDiscoverSmallTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  quickDiscoverMediumTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default HomeScreen; 