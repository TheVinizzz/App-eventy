import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { useEvenLove } from '../contexts/EvenLoveContext';
import { EvenLoveMatch } from '../types/evenLove';
import websocketService from '../services/websocketService';

const { width, height } = Dimensions.get('window');

type EvenLoveMatchesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EvenLoveMatches'>;
type EvenLoveMatchesScreenRouteProp = RouteProp<RootStackParamList, 'EvenLoveMatches'>;

const EvenLoveMatchesScreen: React.FC = () => {
  const navigation = useNavigation<EvenLoveMatchesScreenNavigationProp>();
  const route = useRoute<EvenLoveMatchesScreenRouteProp>();
  const { eventId } = route.params;

  const { 
    matches, 
    isMatchesLoading, 
    matchesError,
    loadMatches,
    unreadMatchesCount 
  } = useEvenLove();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'recent'>('all');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadMatchesData();
      connectWebSocket();
      
      return () => {
        websocketService.disconnect();
      };
    }, [eventId])
  );

  useEffect(() => {
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadMatchesData = async () => {
    try {
      await loadMatches(eventId);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const connectWebSocket = async () => {
    try {
      await websocketService.connect(eventId);
      
      // Listen for new matches
      websocketService.on('match:new', (match) => {
        loadMatchesData();
      });

      // Listen for new messages
      websocketService.on('message:new', (message) => {
        loadMatchesData();
      });

    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatchesData();
    setRefreshing(false);
  };

  const handleMatchPress = (match: EvenLoveMatch) => {
    navigation.navigate('EvenLoveChat', { 
      eventId, 
      matchId: match.id,
      matchName: getMatchName(match),
    });
  };

  const getMatchName = (match: EvenLoveMatch): string => {
    // Determine which profile is the other user
    const otherProfile = match.profile1.userId === 'current_user_id' 
      ? match.profile2 
      : match.profile1;
    return otherProfile.displayName;
  };

  const getMatchPhoto = (match: EvenLoveMatch): string | null => {
    const otherProfile = match.profile1.userId === 'current_user_id' 
      ? match.profile2 
      : match.profile1;
    return otherProfile.photos[0] || null;
  };

  const getFilteredMatches = (): EvenLoveMatch[] => {
    let filtered = [...matches];
    
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(match => match.unreadCount > 0);
        break;
      case 'recent':
        filtered = filtered.filter(match => match.lastMessageAt);
        filtered.sort((a, b) => 
          new Date(b.lastMessageAt!).getTime() - new Date(a.lastMessageAt!).getTime()
        );
        break;
      default:
        filtered.sort((a, b) => 
          new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
        );
    }
    
    return filtered;
  };

  const formatLastMessage = (match: EvenLoveMatch): string => {
    if (!match.lastMessageAt) {
      return 'Novo match! Diga olá 👋';
    }
    
    const lastMessageDate = new Date(match.lastMessageAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastMessageDate.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return 'Agora há pouco';
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else if (diffDays < 7) {
      return `${diffDays}d atrás`;
    } else {
      return lastMessageDate.toLocaleDateString();
    }
  };

  const renderMatch = ({ item: match, index }: { item: EvenLoveMatch; index: number }) => {
    const otherProfile = match.profile1.userId === 'current_user_id' 
      ? match.profile2 
      : match.profile1;

    return (
      <Animated.View
        style={[
          styles.matchCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [index * 10, 0],
              })
            }],
          }
        ]}
      >
        <TouchableOpacity
          style={styles.matchContent}
          onPress={() => handleMatchPress(match)}
          activeOpacity={0.8}
        >
          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 193, 7, 0.1)']}
              style={styles.photoPlaceholder}
            >
              <Ionicons name="person" size={32} color={colors.brand.primary} />
            </LinearGradient>
            
            {/* Online indicator */}
            {otherProfile.isActive && (
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineDot} />
              </View>
            )}
            
            {/* Unread badge */}
            {match.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {match.unreadCount > 9 ? '9+' : match.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Match Info */}
          <View style={styles.matchInfo}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchName}>{otherProfile.displayName}</Text>
              <Text style={styles.matchTime}>{formatLastMessage(match)}</Text>
            </View>
            
            <View style={styles.matchDetails}>
              <Text style={styles.matchAge}>{otherProfile.age} anos</Text>
              {otherProfile.interests.length > 0 && (
                <View style={styles.interestDot} />
              )}
              {otherProfile.interests.slice(0, 2).map((interest, idx) => (
                <Text key={idx} style={styles.matchInterest}>
                  {interest}
                </Text>
              ))}
            </View>
            
            <Text style={styles.matchPreview} numberOfLines={1}>
              {!match.lastMessageAt 
                ? 'Vocês se curtiram! Comece uma conversa 💬'
                : 'Última mensagem...'
              }
            </Text>
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['rgba(40, 40, 40, 0.5)', 'rgba(30, 30, 30, 0.7)']}
        style={styles.emptyCard}
      >
        <View style={styles.emptyIcon}>
          <LinearGradient
            colors={[colors.brand.primary, '#FFD700']}
            style={styles.emptyIconGradient}
          >
            <Ionicons name="heart-outline" size={48} color="white" />
          </LinearGradient>
        </View>
        
        <Text style={styles.emptyTitle}>Nenhum match ainda</Text>
        <Text style={styles.emptySubtitle}>
          Continue explorando perfis para encontrar pessoas interessantes!
        </Text>
        
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={() => navigation.navigate('EvenLoveMain', { eventId })}
        >
          <LinearGradient
            colors={[colors.brand.primary, '#FFD700']}
            style={styles.emptyActionGradient}
          >
            <Ionicons name="search" size={18} color="#000000" />
            <Text style={styles.emptyActionText}>Explorar perfis</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderFilterTab = (filterType: 'all' | 'unread' | 'recent', label: string, count?: number) => (
    <TouchableOpacity
      style={[
        styles.filterTab,
        filter === filterType && styles.filterTabActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterTabText,
        filter === filterType && styles.filterTabTextActive
      ]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const filteredMatches = getFilteredMatches();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient colors={['#151515', '#1f1f1f', '#252525']} style={styles.background}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.brand.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <LinearGradient
              colors={[colors.brand.primary, '#FFD700']}
              style={styles.headerIcon}
            >
              <Ionicons name="heart" size={20} color="#000000" />
            </LinearGradient>
            <Text style={styles.headerTitle}>Matches</Text>
            {unreadMatchesCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {unreadMatchesCount > 99 ? '99+' : unreadMatchesCount}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => Alert.alert('Configurações', 'Em desenvolvimento!')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.brand.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={styles.filterTabs}>
            {renderFilterTab('all', 'Todos', matches.length)}
            {renderFilterTab('unread', 'Não lidas', unreadMatchesCount)}
            {renderFilterTab('recent', 'Recentes')}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isMatchesLoading && matches.length === 0 ? (
            <View style={styles.loadingContainer}>
              <LinearGradient
                colors={[colors.brand.primary, '#FFD700']}
                style={styles.loadingIcon}
              >
                <Ionicons name="heart" size={24} color="#000000" />
              </LinearGradient>
              <Text style={styles.loadingText}>Carregando matches...</Text>
            </View>
          ) : filteredMatches.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredMatches}
              renderItem={renderMatch}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.brand.primary}
                  colors={[colors.brand.primary]}
                />
              }
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
  },
  headerBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  headerBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
  },
  filterContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterTabActive: {
    backgroundColor: colors.brand.primary,
  },
  filterTabText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: '#cccccc',
  },
  filterTabTextActive: {
    color: '#000000',
  },
  filterBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: '#cccccc',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.md,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  emptyAction: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyActionText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: '#000000',
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  matchCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333333',
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  photoContainer: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#252525',
  },
  unreadText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  matchName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
  },
  matchTime: {
    fontSize: typography.fontSizes.xs,
    color: '#666666',
  },
  matchDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  matchAge: {
    fontSize: typography.fontSizes.sm,
    color: '#cccccc',
  },
  interestDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#666666',
  },
  matchInterest: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
  },
  matchPreview: {
    fontSize: typography.fontSizes.sm,
    color: '#999999',
  },
  arrowContainer: {
    marginLeft: spacing.md,
  },
});

export default EvenLoveMatchesScreen; 