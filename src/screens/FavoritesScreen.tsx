import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Share,
  StatusBar,
  Dimensions,
  Image,
  Platform,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// BlurView component replacement
const BlurView: React.FC<{ intensity: number; style: any; children: React.ReactNode }> = ({ children, style }) => (
  <View style={[style, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
    {children}
  </View>
);
import { colors, spacing, typography, borderRadius } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { format, parseISO, isAfter, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';

import { favoritesService, FavoriteEvent } from '../services/favoritesService';
import { ActivitySpinner } from '../components/ui/ActivitySpinner';

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface FilterChip {
  id: 'all' | 'active' | 'expired';
  title: string;
  icon: string;
}

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
  });

  const filterChips: FilterChip[] = [
    { id: 'all', title: 'Todos', icon: 'apps' },
    { id: 'active', title: 'Ativos', icon: 'flash' },
    { id: 'expired', title: 'Expirados', icon: 'time' },
  ];

  // Layout configurations
  const cardConfig = {
    columns: isLandscape ? 2 : 1,
    cardWidth: isLandscape ? (screenWidth - spacing.lg * 3) / 2 : screenWidth - spacing.lg * 2,
    cardHeight: isLandscape ? 180 : 140,
    imageSize: isLandscape ? 120 : 100,
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    filterFavorites();
  }, [favorites, searchQuery, activeFilter]);

  const loadFavorites = async () => {
    try {
      console.log('💝 FavoritesScreen: Loading favorites...');
      
      const [favoritesData, statsData] = await Promise.all([
        favoritesService.getFavorites(),
        favoritesService.getFavoritesStats(),
      ]);
      
      setFavorites(favoritesData);
      setStats(statsData);
      
      console.log('✅ FavoritesScreen: Favorites loaded:', favoritesData.length);
    } catch (error) {
      console.error('❌ FavoritesScreen: Error loading favorites:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus favoritos');
    } finally {
      setIsLoading(false);
    }
  };

  const filterFavorites = async () => {
    try {
      let filtered = favorites;

      // Aplicar filtro de busca
      if (searchQuery.trim()) {
        filtered = await favoritesService.searchFavorites(searchQuery);
        // Manter apenas os favoritos já carregados que correspondem à busca
        filtered = filtered.filter(searchResult => 
          favorites.some(fav => fav.id === searchResult.id)
        );
      }

      // Aplicar filtro de status
      const now = new Date();
      switch (activeFilter) {
        case 'active':
          filtered = filtered.filter(favorite => {
            const eventDate = new Date(favorite.eventDate);
            return eventDate > now && favorite.isActive;
          });
          break;
        case 'expired':
          filtered = filtered.filter(favorite => {
            const eventDate = new Date(favorite.eventDate);
            return eventDate <= now || !favorite.isActive;
          });
          break;
        default:
          break;
      }

      setFilteredFavorites(filtered);
    } catch (error) {
      console.error('❌ FavoritesScreen: Error filtering favorites:', error);
      setFilteredFavorites(favorites);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFavorites();
    setIsRefreshing(false);
  }, []);

  const handleRemoveFavorite = async (eventId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert(
        'Remover dos Favoritos',
        'Tem certeza que deseja remover este evento dos seus favoritos?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              const success = await favoritesService.removeFromFavorites(eventId);
              if (success) {
                setFavorites(prev => prev.filter(fav => fav.id !== eventId));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ FavoritesScreen: Error removing favorite:', error);
      Alert.alert('Erro', 'Não foi possível remover dos favoritos');
    }
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventDetails', { eventId });
  };

  const handleShareFavorites = async () => {
    try {
      const activeFavorites = favorites.filter(fav => {
        const eventDate = new Date(fav.eventDate);
        return eventDate > new Date() && fav.isActive;
      });

      if (activeFavorites.length === 0) {
        Alert.alert('Ops!', 'Você não tem eventos favoritos ativos para compartilhar');
        return;
      }

      const message = `🎉 Meus eventos favoritos no Eventy!\n\n${activeFavorites
        .slice(0, 3)
        .map(fav => `📅 ${fav.title}\n📍 ${fav.location}\n💰 R$ ${fav.price.toFixed(2)}`)
        .join('\n\n')}\n\n${activeFavorites.length > 3 ? `E mais ${activeFavorites.length - 3} eventos!` : ''}\n\nBaixe o Eventy e descubra eventos incríveis! 🚀`;

      await Share.share({
        message,
        title: 'Meus Eventos Favoritos - Eventy',
      });
    } catch (error) {
      console.error('❌ FavoritesScreen: Error sharing favorites:', error);
    }
  };

  const renderFilterChip = ({ item }: { item: FilterChip }) => {
    const isActive = activeFilter === item.id;
    const count = item.id === 'all' ? stats.total : 
                  item.id === 'active' ? stats.active : stats.expired;
    
    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          isActive && styles.filterChipActive,
          isActive && { backgroundColor: colors.brand.primary },
        ]}
        onPress={() => {
          setActiveFilter(item.id);
          Haptics.selectionAsync();
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.icon as any}
          size={16}
          color={isActive ? colors.brand.background : colors.brand.textSecondary}
        />
        <Text
          style={[
            styles.filterChipText,
            isActive && styles.filterChipTextActive,
          ]}
        >
          {item.title}
        </Text>
        {count > 0 && (
          <View style={[styles.chipBadge, isActive && styles.chipBadgeActive]}>
            <Text style={[styles.chipBadgeText, isActive && styles.chipBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFavoriteCard = ({ item, index }: { item: FavoriteEvent; index: number }) => {
    const eventDate = new Date(item.eventDate);
    const now = new Date();
    const isExpired = eventDate <= now || !item.isActive;
    const daysUntilEvent = differenceInDays(eventDate, now);
    
    const getStatusInfo = () => {
      if (isExpired) return { text: 'Expirado', color: colors.brand.error };
      if (daysUntilEvent === 0) return { text: 'Hoje', color: colors.brand.warning };
      if (daysUntilEvent === 1) return { text: 'Amanhã', color: colors.brand.primary };
      if (daysUntilEvent <= 7) return { text: `${daysUntilEvent}d`, color: colors.brand.success };
      return { text: `${daysUntilEvent}d`, color: colors.brand.textSecondary };
    };

    const statusInfo = getStatusInfo();
    
    return (
      <TouchableOpacity
        style={[
          styles.eventCard,
          { width: cardConfig.cardWidth },
          isLandscape && index % 2 === 1 && styles.eventCardRight,
        ]}
        onPress={() => handleEventPress(item.id)}
        activeOpacity={0.95}
      >
        <LinearGradient
          colors={isExpired ? 
            ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.01)'] : 
            ['rgba(255, 215, 0, 0.03)', 'rgba(255, 255, 255, 0.02)']
          }
          style={styles.eventCardGradient}
        >
          {/* Background Image with Overlay */}
          {item.imageUrl && (
            <ImageBackground
              source={{ uri: item.imageUrl }}
              style={styles.cardBackground}
              imageStyle={styles.cardBackgroundImage}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
                style={styles.cardOverlay}
              />
            </ImageBackground>
          )}

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusBadgeText}>{statusInfo.text}</Text>
          </View>

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveFavorite(item.id);
            }}
            activeOpacity={0.7}
          >
            <BlurView intensity={20} style={styles.favoriteButtonBlur}>
              <Ionicons name="heart" size={20} color={colors.brand.error} />
            </BlurView>
          </TouchableOpacity>

          {/* Event Image */}
          <View style={styles.eventImageContainer}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
            ) : (
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={styles.eventImagePlaceholder}
              >
                <Ionicons name="calendar" size={32} color={colors.brand.background} />
              </LinearGradient>
            )}
          </View>

          {/* Event Content */}
          <View style={styles.eventContent}>
            <Text 
              style={[styles.eventTitle, isExpired && styles.eventTitleExpired]} 
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
            
            <View style={styles.eventMeta}>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.brand.textSecondary} />
                <Text style={styles.metaText}>
                  {format(eventDate, "dd MMM", { locale: ptBR })}
                </Text>
              </View>
              
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.brand.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            </View>

            <View style={styles.eventFooter}>
              <Text style={styles.eventPrice}>
                {item.price > 0 ? `R$ ${item.price.toFixed(2)}` : 'Gratuito'}
              </Text>
              <Text style={styles.favoriteDate}>
                {format(parseISO(item.favoriteDate), "dd/MM", { locale: ptBR })}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, isLandscape && styles.headerLandscape]}>
      {/* Top Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BlurView intensity={20} style={styles.navButtonBlur}>
            <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
          </BlurView>
        </TouchableOpacity>
        
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Meus Favoritos</Text>
          <Text style={styles.navSubtitle}>
            {stats.total} evento{stats.total !== 1 ? 's' : ''} • {stats.active} ativo{stats.active !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={handleShareFavorites}
          activeOpacity={0.7}
        >
          <BlurView intensity={20} style={styles.navButtonBlur}>
            <Ionicons name="share-outline" size={24} color={colors.brand.primary} />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <BlurView intensity={20} style={styles.searchBlur}>
          <Ionicons name="search" size={20} color={colors.brand.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar nos favoritos..."
            placeholderTextColor={colors.brand.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.brand.textSecondary} />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>

      {/* Filter Chips */}
      <FlatList
        data={filterChips}
        renderItem={renderFilterChip}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChips}
        style={styles.filterContainer}
      />


    </View>
  );

  const renderEmptyState = () => {
    const getEmptyConfig = () => {
      if (searchQuery.trim()) {
        return {
          icon: 'search-outline',
          title: 'Nenhum resultado encontrado',
          subtitle: 'Tente ajustar sua busca ou limpe os filtros',
          buttonText: 'Limpar busca',
          onPress: () => setSearchQuery(''),
        };
      }
      
      switch (activeFilter) {
        case 'active':
          return {
            icon: 'flash-outline',
            title: 'Nenhum evento ativo',
            subtitle: 'Seus eventos favoritos ativos aparecerão aqui',
            buttonText: 'Ver todos',
            onPress: () => setActiveFilter('all'),
          };
        case 'expired':
          return {
            icon: 'time-outline',
            title: 'Nenhum evento expirado',
            subtitle: 'Eventos passados aparecerão aqui',
            buttonText: 'Ver ativos',
            onPress: () => setActiveFilter('active'),
          };
        default:
          return {
            icon: 'heart-outline',
            title: 'Nenhum favorito ainda',
            subtitle: 'Comece explorando eventos e salvando seus favoritos',
            buttonText: 'Explorar eventos',
            onPress: () => navigation.navigate('Search'),
          };
      }
    };

    const config = getEmptyConfig();

    return (
      <View style={styles.emptyState}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.05)', 'transparent']}
          style={styles.emptyGradient}
        >
          <View style={styles.emptyIcon}>
            <Ionicons name={config.icon as any} size={64} color={colors.brand.textSecondary} />
          </View>
          
          <Text style={styles.emptyTitle}>{config.title}</Text>
          <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
          
          <TouchableOpacity 
            style={styles.emptyButton} 
            onPress={config.onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.brand.primary, colors.brand.secondary]}
              style={styles.emptyButtonGradient}
            >
              <Text style={styles.emptyButtonText}>{config.buttonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
        <LinearGradient
          colors={[colors.brand.background, colors.brand.darkGray]}
          style={styles.gradient}
        >
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <ActivitySpinner 
              size="large"
              message="Carregando seus favoritos..."
              showMessage={true}
              color={colors.brand.primary}
            />
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
          data={filteredFavorites}
          renderItem={renderFavoriteCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          numColumns={cardConfig.columns}
          key={`${cardConfig.columns}-${isLandscape}`}
          contentContainerStyle={[
            styles.listContent,
            filteredFavorites.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={isLandscape ? styles.row : undefined}
        />
      </LinearGradient>
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
  header: {
    paddingBottom: spacing.xl,
  },
  headerLandscape: {
    paddingBottom: spacing.lg,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    //paddingHorizontal: spacing.xxs,
    paddingTop: Platform.OS === 'ios' ? spacing.sm : spacing.lg,
    paddingBottom: spacing.lg,
  },
  navButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  navButtonBlur: {
    padding: spacing.md,
  },
  navCenter: {
    flex: 1,
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
  },
  navTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    letterSpacing: -0.5,
  },
  navSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    //paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  filterContainer: {
    paddingBottom: spacing.sm,
  },
  filterChips: {
    //paddingHorizontal: spacing.lg,
    gap: spacing.xxxs,
  },
  filterChip: {
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
  filterChipActive: {
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  filterChipTextActive: {
    color: colors.brand.background,
    fontWeight: typography.fontWeights.bold,
  },
  chipBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 18,
    minHeight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBadgeActive: {
    backgroundColor: colors.brand.background,
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  chipBadgeTextActive: {
    color: colors.brand.primary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  eventCardRight: {
    marginLeft: spacing.lg,
  },
  eventCardGradient: {
    height: 140,
    position: 'relative',
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardBackgroundImage: {
    borderRadius: borderRadius.xl,
    opacity: 0.15,
  },
  cardOverlay: {
    flex: 1,
    borderRadius: borderRadius.xl,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 28,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
    textAlign: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    zIndex: 1,
  },
  favoriteButtonBlur: {
    padding: spacing.sm,
  },
  eventImageContainer: {
    position: 'absolute',
    left: spacing.lg,
    top: spacing.lg,
    zIndex: 1,
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.darkGray,
  },
  eventImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
    paddingLeft: 64 + spacing.lg + spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    lineHeight: typography.fontSizes.lg * 1.2,
    letterSpacing: -0.3,
  },
  eventTitleExpired: {
    color: colors.brand.textSecondary,
  },
  eventMeta: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  eventPrice: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  favoriteDate: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textTertiary,
    fontWeight: typography.fontWeights.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyGradient: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    width: '100%',
  },
  emptyIcon: {
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * 1.5,
    marginBottom: spacing.xl * 2,
  },
  emptyButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  emptyButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

});

export default FavoritesScreen; 