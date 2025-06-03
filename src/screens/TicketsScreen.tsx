import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AppState,
  AppStateStatus,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TicketCard, TicketCardSkeleton, LoadingScreen, TicketModal, EventTicketCardSkeleton } from '../components/ui';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { 
  ticketsService, 
  Ticket, 
  TicketGroupedByEvent, 
  TicketStats, 
  TicketStatus 
} from '../services/ticketsService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TicketsStackParamList } from '../navigation/types';

type TicketsScreenNavigationProp = StackNavigationProp<TicketsStackParamList, 'TicketsScreen'>;

interface ViewMode {
  mode: 'overview' | 'event';
  eventGroup?: TicketGroupedByEvent;
}

const TicketsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<TicketsScreenNavigationProp>();
  
  const [ticketGroups, setTicketGroups] = useState<TicketGroupedByEvent[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>({ mode: 'overview' });
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [isTicketModalVisible, setIsTicketModalVisible] = useState(false);
  const [updatingTickets, setUpdatingTickets] = useState<Set<string>>(new Set());
  
  // Image loading states for each event
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [imageErrorStates, setImageErrorStates] = useState<Record<string, boolean>>({});
  const shimmerValues = useRef<Record<string, Animated.Value>>({});
  
  // Real-time updates
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const lastUpdateRef = useRef<number>(Date.now());
  const ticketGroupsRef = useRef<TicketGroupedByEvent[]>([]);

  // Update refs when state changes
  useEffect(() => {
    ticketGroupsRef.current = ticketGroups;
  }, [ticketGroups]);

  // Initialize image loading states when ticket groups change
  useEffect(() => {
    const newLoadingStates: Record<string, boolean> = {};
    const newErrorStates: Record<string, boolean> = {};
    
    ticketGroups.forEach(group => {
      newLoadingStates[group.event.id] = true;
      newErrorStates[group.event.id] = false;
      
      // Initialize shimmer animation for each event if not exists
      if (!shimmerValues.current[group.event.id]) {
        shimmerValues.current[group.event.id] = new Animated.Value(0);
      }
    });
    
    setImageLoadingStates(newLoadingStates);
    setImageErrorStates(newErrorStates);
  }, [ticketGroups]);

  // Start shimmer animations for loading images
  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];
    
    Object.keys(imageLoadingStates).forEach(eventId => {
      if (imageLoadingStates[eventId] && shimmerValues.current[eventId]) {
        const shimmerAnimation = Animated.loop(
          Animated.timing(shimmerValues.current[eventId], {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        animations.push(shimmerAnimation);
        shimmerAnimation.start();
      }
    });

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, [imageLoadingStates]);

  // Image handling functions
  const handleImageLoad = useCallback((eventId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [eventId]: false }));
    setImageErrorStates(prev => ({ ...prev, [eventId]: false }));
    
    // Stop shimmer animation
    if (shimmerValues.current[eventId]) {
      shimmerValues.current[eventId].stopAnimation();
    }
  }, []);

  const handleImageError = useCallback((eventId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [eventId]: false }));
    setImageErrorStates(prev => ({ ...prev, [eventId]: true }));
    
    // Stop shimmer animation
    if (shimmerValues.current[eventId]) {
      shimmerValues.current[eventId].stopAnimation();
    }
  }, []);

  // Fetch tickets data
  const fetchTicketsData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [groupsData, statsData] = await Promise.all([
        ticketsService.getUserTicketsGrouped(),
        ticketsService.getUserTicketStats()
      ]);

      setTicketGroups(groupsData);
      setStats(statsData);
      lastUpdateRef.current = Date.now();
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar os ingressos. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Real-time status monitoring with stable reference
  const checkForUpdates = useCallback(async () => {
    if (appStateRef.current !== 'active') return;
    
    try {
      const newGroups = await ticketsService.getUserTicketsGrouped();
      
      // Check for status changes using the ref
      const oldTickets = ticketGroupsRef.current.flatMap(group => group.tickets);
      const newTickets = newGroups.flatMap(group => group.tickets);
      
      const statusChanges = newTickets.filter(newTicket => {
        const oldTicket = oldTickets.find(old => old.id === newTicket.id);
        return oldTicket && oldTicket.status !== newTicket.status;
      });

      if (statusChanges.length > 0) {
        // Update state
        setTicketGroups(newGroups);
        
        // Show notification for status changes
        statusChanges.forEach(ticket => {
          if (ticket.status === TicketStatus.USED) {
            Alert.alert(
              'Ingresso Utilizado',
              `Seu ingresso para "${ticket.event.title}" foi utilizado com sucesso!`,
              [{ text: 'OK' }]
            );
          }
        });
        
        // Update stats
        const newStats = await ticketsService.getUserTicketStats();
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error in real-time update:', error);
    }
  }, []);

  // Start real-time updates with stable interval
  useEffect(() => {
    if (!user) return;

    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Set up polling every 30 seconds (reduced frequency)
    updateIntervalRef.current = setInterval(checkForUpdates, 30000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [user, checkForUpdates]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, check for updates
        const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
        if (timeSinceLastUpdate > 30000) { // 30 seconds
          // Fetch data directly without depending on callback
          (async () => {
            try {
              const [groupsData, statsData] = await Promise.all([
                ticketsService.getUserTicketsGrouped(),
                ticketsService.getUserTicketStats()
              ]);
              setTicketGroups(groupsData);
              setStats(statsData);
              lastUpdateRef.current = Date.now();
            } catch (error) {
              console.error('Failed to fetch tickets on app resume:', error);
            }
          })();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []); // No dependencies

  // Initial data fetch - simplified
  useEffect(() => {
    if (user) {
      fetchTicketsData(true);
    } else {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [user, fetchTicketsData]); // Include fetchTicketsData but it's now stable

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTicketsData(false);
  }, [fetchTicketsData]);

  // QR Scanner navigation
  const handleQRScannerPress = useCallback(() => {
    // navigation.navigate('QRScanner');
    Alert.alert('QR Scanner', 'Funcionalidade em desenvolvimento');
  }, []);

  const handleTicketPress = useCallback((ticket: Ticket) => {
    setSelectedTickets([ticket]);
    setSelectedTicketIndex(0);
    setIsTicketModalVisible(true);
  }, []);

  const handleQRPress = useCallback((ticket: Ticket) => {
    // Find all tickets for the same event
    const eventTickets = ticketGroups
      .find(group => group.event.id === ticket.event.id)
      ?.tickets || [ticket];
    
    const initialIndex = eventTickets.findIndex(t => t.id === ticket.id);
    
    setSelectedTickets(eventTickets);
    setSelectedTicketIndex(initialIndex >= 0 ? initialIndex : 0);
    setIsTicketModalVisible(true);
  }, [ticketGroups]);

  const handleCloseTicketModal = useCallback(() => {
    setIsTicketModalVisible(false);
    setSelectedTickets([]);
    setSelectedTicketIndex(0);
  }, []);

  const handleEventPress = useCallback((eventGroup: TicketGroupedByEvent) => {
    setViewMode({ mode: 'event', eventGroup });
  }, []);

  const handleBackToOverview = useCallback(() => {
    setViewMode({ mode: 'overview' });
  }, []);

  // Loading skeleton component
  const renderTicketSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <Text style={styles.sectionTitle}>Próximos Eventos</Text>
      {Array.from({ length: 3 }).map((_, index) => (
        <EventTicketCardSkeleton key={index} />
      ))}
    </View>
  );

  const renderEventCard = ({ item: eventGroup, index }: { item: TicketGroupedByEvent; index: number }) => {
    const eventId = eventGroup.event.id;
    const imageLoading = imageLoadingStates[eventId] ?? true;
    const imageError = imageErrorStates[eventId] ?? false;
    const shimmerValue = shimmerValues.current[eventId];
    
    const activeCount = eventGroup.tickets.filter(t => t.status === TicketStatus.ACTIVE).length;
    const usedCount = eventGroup.tickets.filter(t => t.status === TicketStatus.USED).length;
    const isUpcoming = new Date(eventGroup.event.date) > new Date();
    const isPastEvent = new Date(eventGroup.event.date) < new Date();
    const allTicketsUsed = eventGroup.tickets.every(t => t.status === TicketStatus.USED);
    const eventDate = new Date(eventGroup.event.date);
    const today = new Date();
    const isToday = eventDate.toDateString() === today.toDateString();
    const isTomorrow = eventDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();

    let timeLabel = '';
    let statusLabel = '';
    let statusBgColor = '';
    let statusIcon = '';
    
    if (isToday) {
      timeLabel = 'Hoje';
      statusLabel = 'Hoje';
      statusBgColor = 'rgba(255, 193, 7, 0.95)';
      statusIcon = 'flash';
    } else if (isTomorrow) {
      timeLabel = 'Amanhã';
      statusLabel = 'Amanhã';
      statusBgColor = 'rgba(0, 212, 170, 0.95)';
      statusIcon = 'calendar';
    } else if (allTicketsUsed) {
      statusLabel = 'Utilizado';
      statusBgColor = 'rgba(139, 147, 161, 0.9)';
      statusIcon = 'checkmark-circle';
    } else if (isUpcoming && activeCount > 0) {
      statusLabel = 'Ativo';
      statusBgColor = 'rgba(0, 212, 170, 0.9)';
      statusIcon = 'checkmark-circle';
    } else {
      timeLabel = ticketsService.formatDate(eventGroup.event.date);
    }

    const translateX = shimmerValue?.interpolate({
      inputRange: [0, 1],
      outputRange: [-200, 200],
    }) ?? new Animated.Value(0);

    const renderImageSkeleton = () => (
      <View style={styles.imageSkeleton}>
        <View style={styles.imageSkeletonBase} />
        <Animated.View
          style={[
            styles.imageSkeletonShimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.0)',
              'rgba(255, 255, 255, 0.12)',
              'rgba(255, 255, 255, 0.0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.imageShimmerGradient}
          />
        </Animated.View>
        <View style={styles.imageSkeletonIcon}>
          <Ionicons name="image" size={28} color="rgba(255, 255, 255, 0.3)" />
          <Text style={styles.imageSkeletonText}>Carregando...</Text>
        </View>
      </View>
    );

    const renderImageError = () => (
      <View style={styles.imageError}>
        <Ionicons name="image-outline" size={28} color={colors.brand.textSecondary} />
        <Text style={styles.imageErrorText}>Imagem não disponível</Text>
      </View>
    );

    return (
      <TouchableOpacity
        style={styles.eventCardContainer}
        onPress={() => handleEventPress(eventGroup)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.eventCard,
          allTicketsUsed && styles.eventCardUsed
        ]}>
          {/* Event Image with Gradient Overlay */}
          <View style={styles.eventImageContainer}>
            {imageLoading && renderImageSkeleton()}
            
            {!imageError && (
              <Image
                source={{ uri: eventGroup.event.imageUrl }}
                style={[
                  styles.eventImage,
                  imageLoading && styles.hiddenImage,
                  allTicketsUsed && styles.eventImageUsed
                ]}
                resizeMode="cover"
                onLoad={() => handleImageLoad(eventId)}
                onError={() => handleImageError(eventId)}
              />
            )}
            
            {imageError && renderImageError()}
            
            {/* Premium Gradient Overlay - Only show when image is loaded */}
            {!imageLoading && !imageError && (
              <LinearGradient
                colors={
                  allTicketsUsed 
                    ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']
                    : ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']
                }
                style={styles.eventImageOverlay}
              />
            )}
            
            {/* Enhanced Status Badge */}
            {statusLabel && !imageLoading && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: statusBgColor }
              ]}>
                {statusIcon && (
                  <Ionicons 
                    name={statusIcon as any} 
                    size={12} 
                    color={allTicketsUsed ? '#8B93A1' : '#fff'} 
                  />
                )}
                {!allTicketsUsed && !statusIcon && <View style={styles.activeDot} />}
                <Text style={[
                  styles.statusBadgeText,
                  allTicketsUsed && styles.statusBadgeTextUsed
                ]}>
                  {statusLabel}
                </Text>
              </View>
            )}

            {/* Click Indicator - Floating Action Icon */}
            {!imageLoading && (
              <View style={styles.clickIndicator}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.9)', 'rgba(255, 165, 0, 0.9)']}
                  style={styles.clickIndicatorGradient}
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.brand.background} />
                </LinearGradient>
              </View>
            )}

            {/* Used Overlay Effect */}
            {allTicketsUsed && !imageLoading && (
              <View style={styles.eventUsedOverlay}>
                <View style={styles.usedOverlayContent}>
                  <Ionicons name="checkmark-circle" size={28} color="rgba(139, 147, 161, 0.8)" />
                  <Text style={styles.usedOverlayText}>Finalizado</Text>
                </View>
              </View>
            )}
          </View>

          {/* Enhanced Card Content */}
          <View style={[
            styles.eventCardContent,
            allTicketsUsed && styles.eventCardContentUsed
          ]}>
            {/* Title with Premium Typography */}
            <Text style={[
              styles.eventTitle,
              allTicketsUsed && styles.eventTitleUsed
            ]} numberOfLines={2}>
              {eventGroup.event.title}
            </Text>
            
            {/* Enhanced Location Row with Icon */}
            <View style={styles.eventLocationRow}>
              <View style={[
                styles.locationIconContainer,
                allTicketsUsed && styles.locationIconContainerUsed
              ]}>
                <Ionicons 
                  name="location" 
                  size={12} 
                  color={allTicketsUsed ? '#8B93A1' : colors.brand.primary} 
                />
              </View>
              <Text style={[
                styles.eventLocationText,
                allTicketsUsed && styles.eventLocationTextUsed
              ]} numberOfLines={1}>
                {eventGroup.event.venue?.name || eventGroup.event.location}
              </Text>
            </View>

            {/* Enhanced Footer with Better Visual Hierarchy */}
            <View style={styles.eventCardFooter}>
              <View style={styles.ticketInfo}>
                <Text style={[
                  styles.ticketCount,
                  allTicketsUsed && styles.ticketCountUsed
                ]}>
                  {eventGroup.totalTickets} {eventGroup.totalTickets === 1 ? 'ingresso' : 'ingressos'}
                </Text>
                <Text style={[
                  styles.totalValue,
                  allTicketsUsed && styles.totalValueUsed
                ]}>
                  {ticketsService.formatPrice(eventGroup.totalSpent)}
                </Text>
              </View>
              
              {/* Tap to View Indicator */}
              <View style={styles.tapIndicator}>
                <Text style={[
                  styles.tapIndicatorText,
                  allTicketsUsed && styles.tapIndicatorTextUsed
                ]}>
                  Tocar para ver
                </Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={12} 
                  color={allTicketsUsed ? '#8B93A1' : colors.brand.primary} 
                />
              </View>
            </View>
          </View>

          {/* Hover/Press Effect Overlay */}
          <View style={styles.pressEffectOverlay} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventDetail = () => {
    if (!viewMode.eventGroup) return null;

    return (
      <View style={styles.eventDetailContainer}>
        {/* Header com botão voltar */}
        <View style={styles.eventDetailHeader}>
          <TouchableOpacity
            style={styles.backButtonMobile}
            onPress={handleBackToOverview}
          >
            <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.eventDetailHeaderText}>
            <Text style={styles.eventDetailTitle} numberOfLines={1}>
              {viewMode.eventGroup.event.title}
            </Text>
            <Text style={styles.eventDetailSubtitle}>
              {viewMode.eventGroup.totalTickets} {viewMode.eventGroup.totalTickets === 1 ? 'ingresso' : 'ingressos'}
            </Text>
          </View>
        </View>

        {/* Lista de tickets */}
        <FlatList
          data={viewMode.eventGroup.tickets}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              variant="compact"
              onPress={() => handleTicketPress(item)}
              onQRPress={() => handleQRPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ticketsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
        />
      </View>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
          style={styles.emptyIconBg}
        >
          <Ionicons name="ticket-outline" size={64} color="#FFD700" />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>Nenhum ingresso encontrado</Text>
      <Text style={styles.emptyDescription}>
        Quando você comprar ingressos, eles aparecerão aqui.
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Home' as never)}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.exploreButtonGradient}
        >
          <Text style={styles.exploreButtonText}>Explorar Eventos</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
        
        {/* Header */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.98)', 'rgba(26, 26, 26, 0.95)']}
          style={styles.simpleHeader}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Meus Ingressos</Text>
            <View style={styles.scanButton}>
              <Ionicons name="qr-code-outline" size={24} color="#FFD700" />
            </View>
          </View>
        </LinearGradient>

        {/* Loading Content */}
        <ScrollView style={styles.content}>
          {renderTicketSkeleton()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.authRequiredMobile}>
          <View style={styles.authIconContainer}>
            <Ionicons name="person-circle-outline" size={80} color={colors.brand.textSecondary} />
          </View>
          <Text style={styles.authTitle}>Faça login</Text>
          <Text style={styles.authSubtitle}>
            Entre na sua conta para ver seus ingressos
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {viewMode.mode === 'overview' ? (
        <View style={styles.container}>
          {/* Simple Header */}
          <View style={styles.simpleHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Meus Ingressos</Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleQRScannerPress}>
                <LinearGradient
                  colors={[colors.brand.primary, '#4F8EF7']}
                  style={styles.scanButtonGradient}
                >
                  <Ionicons name="qr-code-outline" size={24} color={colors.brand.background} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {ticketGroups.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.brand.primary}
                  colors={[colors.brand.primary]}
                />
              }
            >
              {/* Events List */}
              <View style={styles.eventsSection}>
                <Text style={styles.sectionTitle}>Próximos Eventos</Text>
                
                {ticketGroups.map((eventGroup, index) => (
                  <View key={eventGroup.event.id}>
                    {renderEventCard({ item: eventGroup, index })}
                  </View>
                ))}
              </View>
              
              <View style={styles.bottomSpacing} />
            </ScrollView>
          )}
        </View>
      ) : (
        renderEventDetail()
      )}

      {selectedTickets.length > 0 && (
        <TicketModal
          tickets={selectedTickets}
          initialTicketIndex={selectedTicketIndex}
          visible={isTicketModalVisible}
          onClose={handleCloseTicketModal}
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

  // Simple Header
  simpleHeader: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  scanButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  scanButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Events Section
  scrollView: {
    flex: 1,
  },
  eventsSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xl,
  },

  // Enhanced Event Cards with Professional Design
  eventCardContainer: {
    marginBottom: spacing.lg,
  },
  eventCard: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    height: 180,
    position: 'relative',
  },
  eventCardUsed: {
    opacity: 0.8,
    backgroundColor: colors.brand.darkGray,
    borderColor: 'rgba(139, 147, 161, 0.1)',
    elevation: 6,
    shadowOpacity: 0.15,
  },
  eventImageContainer: {
    position: 'relative',
    height: 110,
    width: '100%',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImageUsed: {
    opacity: 0.7,
  },
  eventImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // Enhanced Status Badge
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statusBadgeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.background,
    fontWeight: typography.fontWeights.bold,
  },
  statusBadgeTextUsed: {
    color: '#8B93A1',
  },

  // Click Indicator - Premium floating button
  clickIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  clickIndicatorGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Enhanced Card Content
  eventCardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  eventCardContentUsed: {
    opacity: 0.9,
  },
  eventTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: typography.fontSizes.md * 1.2,
    letterSpacing: 0.3,
  },
  eventTitleUsed: {
    color: '#8B93A1',
  },
  
  // Enhanced Location with Icon Container
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  locationIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconContainerUsed: {
    backgroundColor: 'rgba(139, 147, 161, 0.15)',
  },
  eventLocationText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    flex: 1,
    fontWeight: typography.fontWeights.medium,
  },
  eventLocationTextUsed: {
    color: '#8B93A1',
  },

  // Enhanced Footer
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketCount: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs,
  },
  ticketCountUsed: {
    color: '#8B93A1',
  },
  totalValue: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.bold,
  },
  totalValueUsed: {
    color: '#8B93A1',
  },

  // Tap Indicator - Clear call to action
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  tapIndicatorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  tapIndicatorTextUsed: {
    color: '#8B93A1',
  },

  // Press Effect Overlay
  pressEffectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },

  // Event Detail
  eventDetailContainer: {
    flex: 1,
  },
  eventDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.lg,
  },
  backButtonMobile: {
    padding: spacing.sm,
  },
  eventDetailHeaderText: {
    flex: 1,
  },
  eventDetailTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  eventDetailSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  ticketsList: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: spacing.xl,
  },
  emptyIconBg: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * 1.4,
    marginBottom: spacing.xxxl,
  },
  exploreButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  exploreButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  exploreButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },

  // Auth Required
  authRequiredMobile: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  authIconContainer: {
    marginBottom: spacing.xl,
  },
  authTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * 1.4,
  },

  bottomSpacing: {
    height: spacing.xxxl * 2,
  },

  // Enhanced Used Overlay Effect
  eventUsedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedOverlayContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  usedOverlayText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.background,
  },

  // Enhanced Loading skeleton
  skeletonContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },

  // Loading Content
  content: {
    flex: 1,
  },

  imageSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSkeletonBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSkeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageShimmerGradient: {
    width: '100%',
    height: '100%',
  },
  imageSkeletonIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSkeletonText: {
    fontSize: typography.fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: spacing.xs,
    fontWeight: typography.fontWeights.medium,
  },
  imageError: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  hiddenImage: {
    opacity: 0,
  },
});

export default TicketsScreen; 