import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  eventsService, 
  Event, 
  DashboardMetrics, 
  fetchUserEvents, 
  fetchEventDashboard, 
  deleteEvent,
  fetchUserMetrics 
} from '../services/eventsService';
import EventActionsModal from '../components/ui/EventActionsModal';
import { 
  MyEventsLoadingSkeleton,
  HeaderStatsSkeleton,
  TabsSkeleton,
  EventCardSkeleton 
} from '../components/ui/SkeletonLoader';

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = (screenWidth - CARD_MARGIN * 3) / 2;

interface QuickStat {
  icon: string;
  value: string;
  label: string;
  color: string;
}

interface UserMetrics {
  totalEvents: number;
  publishedEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  upcomingEvents: number;
  totalAttendeesCount: number;
}

const MyEventsScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'closed' | 'drafts'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const searchAnimation = new Animated.Value(0);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, isAuthenticated } = useAuth();

  const loadEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setIsInitialLoad(false);
      return;
    }

    if (!isRefreshing) {
      setIsLoading(true);
    }

    try {
      // Carregar eventos do usuário usando a API real
      const [userEvents, metrics] = await Promise.all([
        fetchUserEvents(),
        fetchUserMetrics()
      ]);
      
      console.log('✅ Eventos carregados do backend:', userEvents);
      console.log('✅ Métricas carregadas do backend:', metrics);
      
      setEvents(userEvents);
      setUserMetrics(metrics);
      
      // Se há eventos, tentar carregar métricas do primeiro evento como exemplo
      if (userEvents.length > 0) {
        try {
          const firstEventId = userEvents[0].id;
          const eventMetrics = await fetchEventDashboard(firstEventId);
          setDashboardMetrics(eventMetrics);
          console.log('✅ Métricas do evento carregadas:', eventMetrics);
        } catch (metricsError) {
          console.warn('⚠️ Não foi possível carregar métricas do evento:', metricsError);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error);
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Não foi possível carregar seus eventos.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsInitialLoad(false);
    }
  }, [isAuthenticated, isRefreshing]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
  };

  const getFilteredEvents = () => {
    const now = new Date();
    let filtered = events;

    switch (activeTab) {
      case 'upcoming':
        filtered = events.filter(event => 
          isAfter(parseISO(event.date), now) && event.published !== false
        );
        break;
      case 'past':
        // Eventos finalizados que aconteceram (últimos 7 dias)
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        filtered = events.filter(event => {
          const eventDate = parseISO(event.date);
          return isBefore(eventDate, now) && 
                 isAfter(eventDate, sevenDaysAgo) && 
                 event.published !== false;
        });
        break;
      case 'closed':
        // Eventos encerrados (mais de 7 dias passados)
        const sevenDaysAgoClosed = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        filtered = events.filter(event => {
          const eventDate = parseISO(event.date);
          return isBefore(eventDate, sevenDaysAgoClosed) && event.published !== false;
        });
        break;
      case 'drafts':
        filtered = events.filter(event => event.published === false);
        break;
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    Animated.timing(searchAnimation, {
      toValue: showSearch ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // Event Actions Handlers
  const handleViewEvent = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  const handleViewDashboard = (event: Event) => {
    navigation.navigate('EventDashboard', { eventId: event.id });
  };

  const handleViewAffiliates = (event: Event) => {
    navigation.navigate('EventAffiliates', { eventId: event.id });
  };

  const handleCheckIn = (event: Event) => {
    navigation.navigate('CheckIn', { eventId: event.id });
  };

  const handleEditEvent = (event: Event) => {
    Alert.alert(
      'Editar Evento',
      `Modificar informações de "${event.title}". Altere título, descrição, data, local, preços e configurações.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Editar', 
          onPress: () => {
            // TODO: Implementar navegação para edição (CreateEvent com dados preenchidos)
            console.log('🔄 Navegar para edição:', event.id);
            Alert.alert('Em Desenvolvimento', 'Edição de eventos será implementada em breve!');
          }
        }
      ]
    );
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      await deleteEvent(event.id);
      Alert.alert('✅ Sucesso', 'Evento excluído com sucesso!');
      loadEvents(); // Recarregar lista
    } catch (error) {
      Alert.alert(
        '❌ Erro',
        error instanceof Error ? error.message : 'Não foi possível excluir o evento.'
      );
    }
  };

  const handleDuplicateEvent = (event: Event) => {
    Alert.alert(
      'Duplicar Evento',
      `Criar uma cópia de "${event.title}" com as mesmas configurações. Você poderá modificar a data e outros detalhes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Duplicar', 
          onPress: () => {
            // TODO: Implementar duplicação de evento
            console.log('🔄 Duplicar evento:', event.id);
            Alert.alert('Em Desenvolvimento', 'Duplicação de eventos será implementada em breve!');
          }
        }
      ]
    );
  };

  const handleCreateEvent = () => {
    navigation.navigate('CreateEvent');
  };

  const showEventActions = (event: Event) => {
    setSelectedEvent(event);
    setActionsModalVisible(true);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd MMM", { locale: ptBR });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "HH:mm", { locale: ptBR });
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = parseISO(event.date);
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    if (event.published === false) {
      return { label: 'Rascunho', color: '#F59E0B' };
    }
    
    if (isAfter(eventDate, now)) {
      return { label: 'Próximo', color: colors.brand.primary };
    }
    
    if (isBefore(eventDate, sevenDaysAgo)) {
      return { label: 'Encerrado', color: '#DC2626' };
    }
    
    return { label: 'Finalizado', color: '#6B7280' };
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.brand.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Meus Eventos</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={toggleSearch}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={showSearch ? "close" : "search"} 
              size={18} 
              color={colors.brand.textPrimary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={handleCreateEvent}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.brand.primary, colors.brand.secondary]}
              style={styles.createGradient}
            >
              <Ionicons name="add" size={18} color={colors.brand.background} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar Animated */}
      <Animated.View style={[
        styles.searchContainer,
        {
          height: searchAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 44],
          }),
          opacity: searchAnimation,
          marginTop: searchAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 12],
          }),
        }
      ]}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={16} color={colors.brand.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar eventos..."
            placeholderTextColor={colors.brand.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>
    </View>
  );

  const renderQuickStats = () => {
    if (isLoading && isInitialLoad) {
      return <HeaderStatsSkeleton />;
    }
    
    if (!userMetrics) return null;
    
    return (
      <View style={styles.statsSection}>
        <View style={styles.statsTitleContainer}>
          <Ionicons name="analytics" size={20} color={colors.brand.primary} />
          <Text style={styles.statsTitle}>Dashboard Geral</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                <Ionicons name="calendar" size={20} color={colors.brand.primary} />
              </View>
              <Text style={styles.statValue}>{userMetrics.totalEvents}</Text>
              <Text style={styles.statLabel}>Eventos Criados</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="cash" size={20} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{formatCurrency(userMetrics.totalRevenue)}</Text>
              <Text style={styles.statLabel}>Receita Total</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="ticket" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{userMetrics.totalTicketsSold}</Text>
              <Text style={styles.statLabel}>Ingressos Vendidos</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="trending-up" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{userMetrics.upcomingEvents}</Text>
              <Text style={styles.statLabel}>Próximos Eventos</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    if (isLoading && isInitialLoad) {
      return <TabsSkeleton />;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const upcomingCount = events.filter(e => isAfter(parseISO(e.date), now) && e.published !== false).length;
    const pastCount = events.filter(e => {
      const eventDate = parseISO(e.date);
      return isBefore(eventDate, now) && isAfter(eventDate, sevenDaysAgo) && e.published !== false;
    }).length;
    const closedCount = events.filter(e => {
      const eventDate = parseISO(e.date);
      return isBefore(eventDate, sevenDaysAgo) && e.published !== false;
    }).length;
    const draftsCount = events.filter(e => e.published === false).length;

    return (
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Próximos
            </Text>
            {upcomingCount > 0 && (
              <View style={[styles.tabBadge, activeTab === 'upcoming' && styles.activeTabBadge]}>
                <Text style={styles.tabBadgeText}>{upcomingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
            onPress={() => setActiveTab('past')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
              Finalizados
            </Text>
            {pastCount > 0 && (
              <View style={[styles.tabBadge, activeTab === 'past' && styles.activeTabBadge]}>
                <Text style={styles.tabBadgeText}>{pastCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'closed' && styles.activeTab]}
            onPress={() => setActiveTab('closed')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>
              Encerrados
            </Text>
            {closedCount > 0 && (
              <View style={[styles.tabBadge, activeTab === 'closed' && styles.activeTabBadge]}>
                <Text style={styles.tabBadgeText}>{closedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'drafts' && styles.activeTab]}
            onPress={() => setActiveTab('drafts')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'drafts' && styles.activeTabText]}>
              Rascunhos
            </Text>
            {draftsCount > 0 && (
              <View style={[styles.tabBadge, activeTab === 'drafts' && styles.activeTabBadge]}>
                <Text style={styles.tabBadgeText}>{draftsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderEventCard = (event: Event) => {
    const status = getEventStatus(event);
    
    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        onPress={() => showEventActions(event)}
        activeOpacity={0.9}
      >
        {/* Event Image */}
        <View style={styles.eventImageContainer}>
          <Image 
            source={{ uri: event.imageUrl || 'https://via.placeholder.com/400x200/1a1a1a/FFD700?text=Evento' }} 
            style={styles.eventImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.eventImageOverlay}
          />
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>

          {/* Date Badge */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{formatDate(event.date).split(' ')[0]}</Text>
            <Text style={styles.dateMonth}>{formatDate(event.date).split(' ')[1]}</Text>
          </View>

          {/* Performance Indicator */}
          <View style={styles.performanceIndicator}>
            <View style={styles.performanceRow}>
              <Ionicons name="trending-up" size={12} color={colors.brand.primary} />
              <Text style={styles.performanceText}>
                {event.ticketsSold || 0}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Event Content */}
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
            <Text style={styles.eventTime}>{formatTime(event.date)}</Text>
          </View>

          <View style={styles.eventLocation}>
            <Ionicons name="location" size={12} color={colors.brand.textSecondary} />
            <Text style={styles.eventLocationText} numberOfLines={1}>{event.location}</Text>
          </View>

          {/* Real Backend Metrics */}
          <View style={styles.eventMetrics}>
            <View style={styles.metric}>
              <Ionicons name="people" size={12} color={colors.brand.primary} />
              <Text style={styles.metricText}>{event.attendeesCount || 0}</Text>
              <Text style={styles.metricLabel}>presentes</Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="ticket" size={12} color={colors.brand.primary} />
              <Text style={styles.metricText}>{event.ticketsSold || 0}</Text>
              <Text style={styles.metricLabel}>vendidos</Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="cash" size={12} color={colors.brand.primary} />
              <Text style={styles.metricText}>{formatCurrency(event.totalRevenue || 0)}</Text>
              <Text style={styles.metricLabel}>receita</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventsList = () => {
    const filteredEvents = getFilteredEvents();

    // Initial loading with skeleton
    if (isLoading && isInitialLoad) {
      return (
        <View style={styles.eventsContainer}>
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </View>
      );
    }

    // Regular loading state
    if (isLoading && !isInitialLoad) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Atualizando dados do backend...</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="person-outline" size={40} color={colors.brand.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Login Necessário</Text>
          <Text style={styles.emptyDescription}>
            Faça login para acessar seus eventos e métricas
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.brand.primary, colors.brand.secondary]}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="person" size={16} color={colors.brand.background} />
              <Text style={styles.emptyButtonText}>Fazer Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredEvents.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={40} color={colors.brand.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Nenhum evento encontrado' : 'Nenhum evento aqui'}
          </Text>
          <Text style={styles.emptyDescription}>
            {searchQuery 
              ? 'Tente ajustar sua busca'
              : activeTab === 'drafts' 
                ? 'Você não tem rascunhos salvos'
                : activeTab === 'closed'
                  ? 'Não há eventos encerrados ainda'
                  : activeTab === 'past'
                    ? 'Nenhum evento finalizado nos últimos 7 dias'
                    : 'Comece criando seu primeiro evento!'
            }
          </Text>
          {!searchQuery && activeTab === 'upcoming' && (
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateEvent} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="add" size={16} color={colors.brand.background} />
                <Text style={styles.emptyButtonText}>Criar Evento</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.eventsContainer}>
        {filteredEvents.map(renderEventCard)}
      </View>
    );
  };

  // Show complete skeleton on initial load
  if (isLoading && isInitialLoad && isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
        {renderHeader()}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <MyEventsLoadingSkeleton />
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
            title="Sincronizando Dados..."
            titleColor={colors.brand.textSecondary}
          />
        }
      >
        {isAuthenticated && renderQuickStats()}
        {isAuthenticated && renderTabs()}
        {renderEventsList()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Event Actions Modal */}
      <EventActionsModal
        visible={actionsModalVisible}
        onClose={() => setActionsModalVisible(false)}
        event={selectedEvent}
        onViewEvent={handleViewEvent}
        onViewDashboard={handleViewDashboard}
        onViewAffiliates={handleViewAffiliates}
        onCheckIn={handleCheckIn}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
        onDuplicateEvent={handleDuplicateEvent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  createGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    overflow: 'hidden',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.brand.textPrimary,
    height: 20,
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand.textPrimary,
  },
  statsContainer: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.brand.darkGray,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
    minHeight: 90,
    justifyContent: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  tabsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tabsContent: {
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  activeTab: {
    backgroundColor: colors.brand.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.brand.textSecondary,
  },
  activeTabText: {
    color: colors.brand.background,
  },
  tabBadge: {
    backgroundColor: colors.brand.textSecondary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand.background,
  },
  eventsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  eventCard: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  eventImageContainer: {
    position: 'relative',
    height: 120,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  dateBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    minWidth: 36,
  },
  dateDay: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    lineHeight: 14,
  },
  dateMonth: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand.primary,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  eventLocationText: {
    fontSize: 13,
    color: colors.brand.textSecondary,
    flex: 1,
  },
  eventMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metricText: {
    fontSize: 11,
    color: colors.brand.textSecondary,
    fontWeight: '500',
  },
  metricLabel: {
    fontSize: 10,
    color: colors.brand.textSecondary,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: colors.brand.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand.background,
  },
  performanceIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacing: {
    height: 80,
  },
});

export default MyEventsScreen; 