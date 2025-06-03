import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SearchEventCard, LoadingScreen, SearchEventCardSkeleton } from '../components/ui';
import { colors, spacing, typography, borderRadius } from '../theme';
import { fetchEvents, EventsQueryParams, PaginatedEvents, EventType, Event } from '../services/eventsService';
import socialService, { UserProfile } from '../services/socialService';
import UserSearchItem from '../components/UserSearchItem';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

interface FilterState {
  search: string;
  type?: EventType;
  isPremium?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
}

const EVENT_TYPES = [
  { value: undefined, label: 'Todos', icon: 'apps' },
  { value: 'SHOW', label: 'Shows', icon: 'musical-notes' },
  { value: 'SPORTS', label: 'Esportes', icon: 'football' },
  { value: 'THEATER', label: 'Teatro', icon: 'library' },
  { value: 'FESTIVAL', label: 'Festivais', icon: 'flame' },
  { value: 'NORMAL', label: 'Eventos Gerais', icon: 'calendar' },
];

const QUICK_FILTERS = [
  { value: undefined, label: 'Todos', icon: 'apps', color: colors.brand.primary },
  { value: 'SHOW', label: 'Shows', icon: 'musical-notes', color: colors.brand.primary },
  { value: 'SPORTS', label: 'Esportes', icon: 'football', color: colors.brand.primary },
  { value: 'THEATER', label: 'Teatro', icon: 'library', color: colors.brand.primary },
  { value: 'FESTIVAL', label: 'Festivais', icon: 'flame', color: colors.brand.primary },
  { value: 'NORMAL', label: 'Eventos', icon: 'calendar', color: colors.brand.primary },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Data', icon: 'calendar' },
  { value: 'title', label: 'Nome', icon: 'text' },
  { value: 'createdAt', label: 'Mais Recentes', icon: 'time' },
  { value: 'featured', label: 'Em Destaque', icon: 'star' },
];

const PRICE_RANGES = [
  { min: undefined, max: undefined, label: 'Qualquer preço' },
  { min: 0, max: 0, label: 'Gratuito' },
  { min: 1, max: 50, label: 'Até R$ 50' },
  { min: 51, max: 100, label: 'R$ 51 - R$ 100' },
  { min: 101, max: 200, label: 'R$ 101 - R$ 200' },
  { min: 201, max: undefined, label: 'Acima de R$ 200' },
];

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'events' | 'users'>('events');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'date',
    sortOrder: 'asc',
  });
  const [events, setEvents] = useState<PaginatedEvents>({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [users, setUsers] = useState<{
    items: UserProfile[];
    total: number;
    page: number;
    hasMore: boolean;
  }>({
    items: [],
    total: 0,
    page: 1,
    hasMore: false,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (searchParams: EventsQueryParams, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await fetchEvents(searchParams);
      setEvents(result);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching events:', error);
      Alert.alert('Erro', 'Não foi possível buscar os eventos. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const searchUsers = useCallback(async (query: string, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await socialService.searchUsers(query, 1, 20);
      
      setUsers({
        items: result.users,
        total: result.total,
        page: 1,
        hasMore: result.hasMore,
      });
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Erro', 'Não foi possível buscar os usuários. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (searchTab === 'events') {
      const searchParams: EventsQueryParams = {
        page: 1,
        limit: 12,
        search: searchQuery.trim() || undefined,
        type: filters.type,
        isPremium: filters.isPremium,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      };
      performSearch(searchParams);
    } else {
      searchUsers(searchQuery.trim());
    }
  }, [searchQuery, searchTab, filters, performSearch, searchUsers]);

  const handleRefresh = useCallback(() => {
    const searchParams: EventsQueryParams = {
      page: 1,
      limit: 12,
      search: searchQuery.trim() || undefined,
      type: filters.type,
      isPremium: filters.isPremium,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
    };

    performSearch(searchParams, true);
  }, [searchQuery, filters, performSearch]);

  const loadMoreEvents = useCallback(async () => {
    if (events.page < events.totalPages && !loading) {
      const searchParams: EventsQueryParams = {
        page: events.page + 1,
        limit: 12,
        search: searchQuery.trim() || undefined,
        type: filters.type,
        isPremium: filters.isPremium,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      };

      try {
        const result = await fetchEvents(searchParams);
        setEvents(prev => ({
          ...result,
          items: [...prev.items, ...result.items],
        }));
      } catch (error) {
        console.error('Error loading more events:', error);
      }
    }
  }, [events, searchQuery, filters, loading]);

  const clearFilters = () => {
    setFilters({
      search: '',
      sortBy: 'date',
      sortOrder: 'asc',
    });
    setSearchQuery('');
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  const handleUserPress = (user: UserProfile) => {
    navigation.navigate('UserProfile', { userId: user.id });
  };

  const handleFollowUser = async (user: UserProfile) => {
    try {
      const result = await socialService.followUser(user.id);
      
      const updatedUsers = users.items.map(u => 
        u.id === user.id 
          ? { 
              ...u, 
              isFollowing: result.isFollowing,
              followersCount: result.followersCount
            }
          : u
      );
      
      setUsers(prev => ({
        ...prev,
        items: updatedUsers
      }));
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status de seguidor');
    }
  };

  const handleQuickFilter = (type: EventType | undefined) => {
    setFilters(prev => ({ ...prev, type }));
    // Auto search when quick filter changes
    setTimeout(() => {
      const searchParams: EventsQueryParams = {
        page: 1,
        limit: 12,
        search: searchQuery.trim() || undefined,
        type,
        isPremium: filters.isPremium,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      };
      performSearch(searchParams);
    }, 100);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type) count++;
    if (filters.isPremium !== undefined) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.sortBy !== 'date' || filters.sortOrder !== 'asc') count++;
    return count;
  };

  // Auto search when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        setFilters(prev => ({ ...prev, search: searchQuery }));
        handleSearch();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  // Load initial events when component mounts
  useEffect(() => {
    const loadInitialEvents = async () => {
      const searchParams: EventsQueryParams = {
        page: 1,
        limit: 12,
        sortBy: 'date',
        sortOrder: 'asc',
      };
      
      await performSearch(searchParams);
    };

    loadInitialEvents();
  }, []); // Empty dependency array means this runs only once when component mounts

  const renderSkeletonList = () => (
    <FlatList
      data={Array(6).fill(null)}
      renderItem={() => <SearchEventCardSkeleton />}
      keyExtractor={(_, index) => `skeleton-${index}`}
      contentContainerStyle={[
        styles.eventsList,
        { paddingBottom: 100 }
      ]}
      showsVerticalScrollIndicator={false}
    />
  );

  const renderInlineLoading = () => (
    <View style={styles.inlineLoadingContainer}>
      <LoadingScreen size="medium" message="Buscando eventos..." />
    </View>
  );

  const renderEventItem = ({ item }: { item: Event }) => (
    <SearchEventCard
      event={item}
      onPress={() => handleEventPress(item)}
    />
  );

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <UserSearchItem
      user={item}
      onPress={handleUserPress}
      showFollowButton={true}
      onFollowPress={handleFollowUser}
    />
  );

  const renderQuickFilter = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.quickFilterChip,
        filters.type === item.value && styles.quickFilterChipActive,
        filters.type === item.value && { backgroundColor: item.color },
      ]}
      onPress={() => handleQuickFilter(item.value)}
    >
      <Ionicons
        name={item.icon as any}
        size={16}
        color={filters.type === item.value ? colors.brand.background : item.color}
      />
      <Text
        style={[
          styles.quickFilterText,
          filters.type === item.value && styles.quickFilterTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Ionicons 
            name={searchTab === 'events' ? "calendar" : "people"} 
            size={64} 
            color={colors.brand.textSecondary} 
          />
          <Text style={styles.emptyStateTitle}>
            {searchTab === 'events' ? 'Eventos Disponíveis' : 'Buscar Usuários'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchTab === 'events' 
              ? 'Explore os eventos disponíveis ou use a busca para encontrar algo específico'
              : 'Digite um nome ou termo para encontrar outros usuários na plataforma'
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={64} color={colors.brand.textSecondary} />
        <Text style={styles.emptyStateTitle}>
          {searchTab === 'events' ? 'Nenhum evento encontrado' : 'Nenhum usuário encontrado'}
        </Text>
        <Text style={styles.emptyStateText}>
          Tente ajustar os filtros ou usar termos de busca diferentes
        </Text>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color={colors.brand.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filtros Avançados</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearButton}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Premium Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Tipo de Ingresso</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.isPremium === undefined && styles.filterOptionActive,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, isPremium: undefined }))}
              >
                <Ionicons
                  name="apps"
                  size={20}
                  color={filters.isPremium === undefined ? colors.brand.background : colors.brand.primary}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.isPremium === undefined && styles.filterOptionTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.isPremium === false && styles.filterOptionActive,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, isPremium: false }))}
              >
                <Ionicons
                  name="gift"
                  size={20}
                  color={filters.isPremium === false ? colors.brand.background : colors.brand.primary}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.isPremium === false && styles.filterOptionTextActive,
                  ]}
                >
                  Gratuitos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.isPremium === true && styles.filterOptionActive,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, isPremium: true }))}
              >
                <Ionicons
                  name="diamond"
                  size={20}
                  color={filters.isPremium === true ? colors.brand.background : colors.brand.primary}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.isPremium === true && styles.filterOptionTextActive,
                  ]}
                >
                  Premium
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Price Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Faixa de Preço</Text>
            <View style={styles.filterOptions}>
              {PRICE_RANGES.map((range, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterOption,
                    filters.minPrice === range.min && filters.maxPrice === range.max && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters(prev => ({ 
                    ...prev, 
                    minPrice: range.min, 
                    maxPrice: range.max 
                  }))}
                >
                  <Ionicons
                    name="pricetag"
                    size={20}
                    color={filters.minPrice === range.min && filters.maxPrice === range.max ? colors.brand.background : colors.brand.primary}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.minPrice === range.min && filters.maxPrice === range.max && styles.filterOptionTextActive,
                    ]}
                  >
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Ordenar por</Text>
            <View style={styles.filterOptions}>
              {SORT_OPTIONS.map((sort) => (
                <TouchableOpacity
                  key={sort.value}
                  style={[
                    styles.filterOption,
                    filters.sortBy === sort.value && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, sortBy: sort.value }))}
                >
                  <Ionicons
                    name={sort.icon as any}
                    size={20}
                    color={filters.sortBy === sort.value ? colors.brand.background : colors.brand.primary}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.sortBy === sort.value && styles.filterOptionTextActive,
                    ]}
                  >
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Order */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Ordem</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.sortOrder === 'asc' && styles.filterOptionActive,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
              >
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={filters.sortOrder === 'asc' ? colors.brand.background : colors.brand.primary}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.sortOrder === 'asc' && styles.filterOptionTextActive,
                  ]}
                >
                  Crescente
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.sortOrder === 'desc' && styles.filterOptionActive,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
              >
                <Ionicons
                  name="arrow-down"
                  size={20}
                  color={filters.sortOrder === 'desc' ? colors.brand.background : colors.brand.primary}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.sortOrder === 'desc' && styles.filterOptionTextActive,
                  ]}
                >
                  Decrescente
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              setShowFilters(false);
              handleSearch();
            }}
          >
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.brand.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar eventos, artistas, locais..."
              placeholderTextColor={colors.brand.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.brand.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options" size={20} color={colors.brand.primary} />
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Tabs */}
      <View style={styles.searchTabs}>
        <TouchableOpacity
          style={[styles.searchTab, searchTab === 'events' && styles.searchTabActive]}
          onPress={() => setSearchTab('events')}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={searchTab === 'events' ? colors.brand.primary : colors.brand.textSecondary} 
          />
          <Text style={[styles.searchTabText, searchTab === 'events' && styles.searchTabTextActive]}>
            Eventos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.searchTab, searchTab === 'users' && styles.searchTabActive]}
          onPress={() => setSearchTab('users')}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={searchTab === 'users' ? colors.brand.primary : colors.brand.textSecondary} 
          />
          <Text style={[styles.searchTabText, searchTab === 'users' && styles.searchTabTextActive]}>
            Usuários
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Filters - Only show for events */}
      {searchTab === 'events' && (
        <View style={styles.quickFiltersSection}>
          <FlatList
            data={QUICK_FILTERS}
            renderItem={renderQuickFilter}
            keyExtractor={(item) => item.label}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickFiltersContainer}
            bounces={false}
          />
        </View>
      )}

      {/* Results Info */}
      {hasSearched && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {searchTab === 'events' 
              ? (events.total > 0 
                  ? `${events.total} evento${events.total > 1 ? 's' : ''} encontrado${events.total > 1 ? 's' : ''}`
                  : 'Nenhum evento encontrado'
                )
              : (users.total > 0 
                  ? `${users.total} usuário${users.total > 1 ? 's' : ''} encontrado${users.total > 1 ? 's' : ''}`
                  : 'Nenhum usuário encontrado'
                )
            }
          </Text>
          
          {searchQuery.trim() && (
            <Text style={styles.searchTermText}>
              para "{searchQuery}"
            </Text>
          )}
        </View>
      )}

      {/* Content List */}
      {loading && !refreshing && !hasSearched ? (
        renderSkeletonList()
      ) : loading && hasSearched ? (
        renderInlineLoading()
      ) : searchTab === 'events' ? (
        <FlatList
          data={events.items}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.eventsList,
            { paddingBottom: 100 } // Espaço embaixo da lista
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
          onEndReached={loadMoreEvents}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
        />
      ) : (
        <FlatList
          data={users.items}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.eventsList,
            { paddingBottom: 100 } // Espaço embaixo da lista
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  searchContainer: {
    flex: 1,
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
    color: colors.brand.textPrimary,
  },
  filterButton: {
    position: 'relative',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.brand.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  quickFiltersSection: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  quickFiltersContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xxxs,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
    marginRight: spacing.sm,
  },
  quickFilterChipActive: {
    borderColor: 'transparent',
  },
  quickFilterText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  quickFilterTextActive: {
    color: colors.brand.background,
    fontWeight: typography.fontWeights.bold,
  },
  resultsInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  resultsText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  searchTermText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
  },
  eventsList: {
    paddingVertical: spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSizes.xl,
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
    lineHeight: typography.fontSizes.md * 1.4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  modalTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  clearButton: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  filterSection: {
    marginVertical: spacing.lg,
  },
  filterTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
    marginBottom: spacing.sm,
  },
  filterOptionActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterOptionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  filterOptionTextActive: {
    color: colors.brand.background,
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.opacity.cardBorder,
  },
  applyButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  inlineLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  searchTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  searchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: spacing.xs,
  },
  searchTabActive: {
    borderBottomColor: colors.brand.primary,
  },
  searchTabText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textSecondary,
  },
  searchTabTextActive: {
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
  },
});

export default SearchScreen; 