import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useEvenLove } from '../contexts/EvenLoveContext';
import { EvenLoveProfile } from '../types/evenLove';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.65;
const SWIPE_THRESHOLD = width * 0.25;

type EvenLoveMainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EvenLoveMain'>;
type EvenLoveMainScreenRouteProp = RouteProp<RootStackParamList, 'EvenLoveMain'>;



const EvenLoveMainScreen: React.FC = () => {
  const navigation = useNavigation<EvenLoveMainScreenNavigationProp>();
  const route = useRoute<EvenLoveMainScreenRouteProp>();
  const { eventId } = route.params;

  // EvenLove Context
  const {
    profiles,
    isProfilesLoading,
    profilesError,
    currentProfileIndex,
    matches,
    loadProfiles,
    swipeProfile,
    loadMatches,
    profile,
    loadProfile,
  } = useEvenLove();

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatchedProfile, setLastMatchedProfile] = useState<EvenLoveProfile | null>(null);
  
  // 🎯 Estado para controlar transição suave de entrada
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);

  // Animations
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const nextCardOpacity = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const headerAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('🔍 EvenLove: Iniciando carregamento de dados para evento:', eventId);
    
    // 🎨 Transição suave de entrada
    const loadDataWithTransition = async () => {
      try {
        // Verificar se usuário tem perfil primeiro
        await loadProfile(eventId);
        console.log('✅ EvenLove: Perfil verificado, carregando outros dados...');
        
        // 🎯 Transição suave ao carregar dados
        Animated.stagger(150, [
          Animated.spring(headerAnimation, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.spring(nextCardScale, {
              toValue: 0.95,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
        
        // Load profiles and matches with smooth transitions
        await Promise.all([
          loadProfiles(eventId).catch(error => {
            console.error('❌ EvenLove: Erro ao carregar perfis:', error);
          }),
          loadMatches(eventId).catch(error => {
            console.error('❌ EvenLove: Erro ao carregar matches:', error);
          })
        ]);
        
        // 🎯 Marcar como carregado para animações mais suaves
        setHasLoadedInitially(true);
        
      } catch (error) {
        console.error('❌ EvenLove: Erro ao verificar perfil:', error);
        // Mesmo se der erro no perfil, tentar carregar perfis
        loadProfiles(eventId).catch(error => {
          console.error('❌ EvenLove: Erro ao carregar perfis:', error);
        });
        setHasLoadedInitially(true);
      }
    };

    loadDataWithTransition();
  }, [eventId]);

  const currentProfile = profiles[currentProfileIndex];
  const nextProfile = profiles[currentProfileIndex + 1];

  // Debug: Log quando os dados mudarem
  useEffect(() => {
    console.log('📊 EvenLove: Estado atualizado:', {
      profilesCount: profiles.length,
      currentIndex: currentProfileIndex,
      isLoading: isProfilesLoading,
      error: profilesError,
      hasCurrentProfile: !!currentProfile,
    });
  }, [profiles, currentProfileIndex, isProfilesLoading, profilesError, currentProfile]);

  const animateSwipe = (direction: 'left' | 'right', callback?: () => void) => {
    const toValueX = direction === 'right' ? width : -width;
    const toValueRotate = direction === 'right' ? 1 : -1;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: toValueX,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: toValueRotate,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(nextCardScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(nextCardOpacity, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animations
      translateX.setValue(0);
      translateY.setValue(0);
      rotate.setValue(0);
      opacity.setValue(1);
      scale.setValue(1);
      nextCardScale.setValue(0.95);
      nextCardOpacity.setValue(0.8);
      
      callback && callback();
    });
  };

  const handleSwipe = async (direction: 'like' | 'pass') => {
    if (!currentProfile) return;

    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Call swipe service
      const result = await swipeProfile(eventId, currentProfile.id, direction);
      
      if (result.isMatch && result.match) {
        setLastMatchedProfile(currentProfile);
        setShowMatchModal(true);
        
        // Animate match modal
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }

      // Animate swipe
      animateSwipe(direction === 'like' ? 'right' : 'left', () => {
        if (currentProfileIndex >= profiles.length - 1) {
          // No more profiles - navigate to matches
          Alert.alert(
            '🎉 Todos os perfis vistos!',
            'Você já viu todos os participantes disponíveis. Que tal conferir seus matches?',
            [
              { text: 'Ver novamente', onPress: () => loadProfiles(eventId) },
              { text: 'Ver Matches', onPress: () => navigation.navigate('EvenLoveMatches', { eventId }) },
              { text: 'Voltar', onPress: () => navigation.goBack() },
            ]
          );
        }
      });
    } catch (error) {
      console.error('Error swiping profile:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar sua ação. Tente novamente.');
    }
  };

  const closeMatchModal = () => {
    Animated.timing(modalScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowMatchModal(false);
      setLastMatchedProfile(null);
    });
  };

  const renderInterestTag = (interest: string, index: number) => (
    <View key={index} style={styles.interestTag}>
      <Text style={styles.interestText}>{interest}</Text>
    </View>
  );

  const renderProfileCard = (profile: EvenLoveProfile, index: number) => {
    const isActive = index === currentProfileIndex;
    const isNext = index === currentProfileIndex + 1;
    
    if (index < currentProfileIndex || index > currentProfileIndex + 1) return null;

    const cardStyle = isActive ? {
      transform: [
        { translateX },
        { translateY },
        { 
          rotate: rotate.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: ['-15deg', '0deg', '15deg'],
          })
        },
        { scale },
      ],
      opacity,
    } : {
      transform: [
        { scale: nextCardScale },
      ],
      opacity: nextCardOpacity,
    };

    return (
      <Animated.View
        key={profile.id}
        style={[
          styles.card,
          cardStyle,
          {
            zIndex: profiles.length - index,
          },
        ]}
      >
        <LinearGradient
          colors={['#2a2a2a', '#252525', '#202020']}
          style={styles.cardGradient}
        >
          {/* Profile Image Placeholder */}
          <View style={styles.imageContainer}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.4)', 'rgba(255, 193, 7, 0.2)', 'rgba(255, 152, 0, 0.1)']}
              style={styles.imagePlaceholder}
            >
              <Ionicons name="person" size={120} color={colors.brand.primary} />
            </LinearGradient>
            
            {/* Status indicators */}
            <View style={styles.statusContainer}>
              {profile.isActive && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.verifiedText}>Ativo</Text>
                </View>
              )}
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Participante</Text>
              </View>
            </View>

            {/* Swipe indicators */}
            <Animated.View 
              style={[
                styles.swipeIndicator,
                styles.likeIndicator,
                {
                  opacity: translateX.interpolate({
                    inputRange: [0, SWIPE_THRESHOLD],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    rotate: translateX.interpolate({
                      inputRange: [0, SWIPE_THRESHOLD],
                      outputRange: ['0deg', '-15deg'],
                      extrapolate: 'clamp',
                    }),
                  }],
                },
              ]}
            >
              <Text style={styles.swipeIndicatorText}>LIKE</Text>
            </Animated.View>

            <Animated.View 
              style={[
                styles.swipeIndicator,
                styles.passIndicator,
                {
                  opacity: translateX.interpolate({
                    inputRange: [-SWIPE_THRESHOLD, 0],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    rotate: translateX.interpolate({
                      inputRange: [-SWIPE_THRESHOLD, 0],
                      outputRange: ['15deg', '0deg'],
                      extrapolate: 'clamp',
                    }),
                  }],
                },
              ]}
            >
              <Text style={styles.swipeIndicatorText}>PASS</Text>
            </Animated.View>
          </View>

          {/* Profile Info */}
          <LinearGradient
            colors={['transparent', 'rgba(30,30,30,0.9)', 'rgba(25,25,25,0.98)']}
            style={styles.infoGradient}
          >
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: 'white' }]}>{profile.displayName}</Text>
                <Text style={[styles.profileAge, { color: '#cccccc' }]}>{profile.age}</Text>
              </View>
              
              <View style={styles.distanceRow}>
                <Ionicons name="location" size={14} color="#FFD700" />
                <Text style={[styles.distanceText, { color: '#aaaaaa' }]}>
                  {profile.location?.distance ? `${Math.round(profile.location.distance)}m` : 'Próximo'}
                </Text>
              </View>
              
              <Text style={[styles.profileBio, { color: '#dddddd' }]} numberOfLines={3}>
                {profile.bio}
              </Text>
              
              <View style={styles.interestsContainer}>
                {profile.interests && profile.interests.slice(0, 3).map(renderInterestTag)}
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderMatchModal = () => {
    if (!showMatchModal || !lastMatchedProfile) return null;

    return (
      <View style={styles.matchModalOverlay}>
        <Animated.View 
          style={[
            styles.matchModal,
            {
              transform: [{ scale: modalScale }],
            },
          ]}
        >
                      <LinearGradient
              colors={['rgba(40, 40, 40, 0.95)', 'rgba(30, 30, 30, 0.97)', 'rgba(25, 25, 25, 0.99)']}
              style={styles.matchModalContent}
            >
            {/* Celebration Animation */}
            <View style={styles.matchAnimation}>
              <LinearGradient
                colors={[colors.brand.primary, '#FFD700', '#FFA000']}
                style={styles.matchIcon}
              >
                <Ionicons name="heart" size={48} color="#000000" />
              </LinearGradient>
              
              {/* Floating hearts */}
              <View style={styles.floatingHearts}>
                <Ionicons name="heart" size={16} color={colors.brand.primary} style={styles.floatingHeart1} />
                <Ionicons name="heart" size={12} color="#FFD700" style={styles.floatingHeart2} />
                <Ionicons name="heart" size={14} color="#FFA000" style={styles.floatingHeart3} />
              </View>
            </View>

            <Text style={styles.matchTitle}>🎉 É um Match!</Text>
            <Text style={styles.matchSubtitle}>
              Você e {lastMatchedProfile.displayName} se curtiram mutuamente!
            </Text>

            <View style={styles.matchProfiles}>
              <View style={styles.matchProfileContainer}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 193, 7, 0.1)']}
                  style={styles.matchProfileImage}
                >
                  <Ionicons name="person" size={28} color={colors.brand.primary} />
                </LinearGradient>
                <Text style={styles.matchProfileName}>Você</Text>
              </View>

              <View style={styles.matchHeart}>
                <LinearGradient
                  colors={[colors.brand.primary, '#FFD700']}
                  style={styles.matchHeartGradient}
                >
                  <Ionicons name="heart" size={20} color="#000000" />
                </LinearGradient>
              </View>

              <View style={styles.matchProfileContainer}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 193, 7, 0.1)']}
                  style={styles.matchProfileImage}
                >
                  <Ionicons name="person" size={28} color={colors.brand.primary} />
                </LinearGradient>
                <Text style={styles.matchProfileName}>{lastMatchedProfile.displayName}</Text>
              </View>
            </View>

            <View style={styles.matchActions}>
              <TouchableOpacity
                style={styles.matchActionSecondary}
                onPress={closeMatchModal}
              >
                <Text style={styles.matchActionSecondaryText}>Continuar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.matchActionPrimary}
                onPress={() => {
                  closeMatchModal();
                  Alert.alert('💬 Chat', 'Funcionalidade de chat em desenvolvimento!');
                }}
              >
                <LinearGradient
                  colors={[colors.brand.primary, '#FFD700', '#FFA000']}
                  style={styles.matchActionPrimaryGradient}
                >
                  <Ionicons name="chatbubbles" size={18} color="#000000" />
                  <Text style={[styles.matchActionPrimaryText, { color: '#000000' }]}>Conversar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
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
            <Ionicons name="people" size={48} color="white" />
          </LinearGradient>
        </View>
        
        <Text style={[styles.emptyTitle, { color: 'white' }]}>
          {profilesError ? 'Erro ao carregar perfis' : 'Nenhum perfil disponível'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: '#cccccc' }]}>
          {profilesError 
            ? 'Verifique sua conexão e tente novamente'
            : 'Volte mais tarde para descobrir novos participantes'
          }
        </Text>
        
        <View style={styles.emptyActions}>
          <TouchableOpacity
            style={[styles.emptyActionSecondary, { backgroundColor: '#333333' }]}
            onPress={() => {
              // 🧭 NAVEGAÇÃO CORRIGIDA: Forçar volta para Main (CommunityScreen)
              console.log('🔙 EvenLove: Voltando do empty state para Main...');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
          >
            <Text style={[styles.emptyActionSecondaryText, { color: '#cccccc' }]}>Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.emptyActionPrimary}
            onPress={() => loadProfiles(eventId)}
          >
            <LinearGradient
              colors={['#FFD700', '#FFC107']}
              style={styles.emptyActionPrimaryGradient}
            >
              <Ionicons name="refresh" size={18} color="#000000" />
              <Text style={[styles.emptyActionPrimaryText, { color: '#000000' }]}>
                {profilesError ? 'Tentar novamente' : 'Atualizar'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient
        colors={['#151515', '#1f1f1f', '#252525']}
        style={styles.background}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              transform: [{ scale: headerAnimation }],
              opacity: headerAnimation,
              backgroundColor: '#1a1a1a', 
              borderBottomWidth: 1,
              borderBottomColor: '#333333'
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // 🧭 NAVEGAÇÃO CORRIGIDA: Forçar volta para Main (CommunityScreen)
              console.log('🔙 EvenLove: Voltando para o Main (tab Community)...');
              
              // Usar reset para garantir que volta para o tab Community
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.headerButtonGradient}
            >
              <Ionicons name="arrow-back" size={22} color={colors.brand.primary} />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <LinearGradient
              colors={['#FFD700', '#FFC107', '#FFA000']}
              style={styles.headerIcon}
            >
              <Ionicons name="heart" size={20} color="#000000" />
            </LinearGradient>
            <Text style={[styles.headerTitle, { color: 'white' }]}>EventLove</Text>
          </View>
          
          <View style={styles.headerRightActions}>
            {/* 🔧 Botão de Editar Perfil */}
            <TouchableOpacity 
              style={[styles.headerButton, { marginRight: 8 }]}
              onPress={() => navigation.navigate('EvenLoveEntry', { 
                eventId, 
                eventTitle: 'Editar Perfil'
              })}
            >
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.1)']}
                style={styles.headerButtonGradient}
              >
                <Ionicons name="person-circle" size={20} color="#FFD700" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Botão de Matches */}
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('EvenLoveMatches', { eventId })}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.headerButtonGradient}
              >
                <Ionicons name="chatbubbles" size={20} color={colors.brand.primary} />
                {matches && matches.length > 0 && (
                  <View style={styles.matchesBadge}>
                    <Text style={styles.matchesBadgeText}>{matches.length}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Cards Container */}
        <Animated.View 
          style={[
            styles.cardsContainer, 
            { 
              backgroundColor: '#1a1a1a',
              opacity: hasLoadedInitially ? opacity : 0.3,
              transform: [{
                translateY: hasLoadedInitially ? 0 : 20
              }]
            }
          ]}
        >
          {isProfilesLoading ? (
            <View style={styles.loadingContainer}>
              <LinearGradient
                colors={[colors.brand.primary, '#FFD700']}
                style={styles.loadingIcon}
              >
                <Ionicons name="heart" size={32} color="#000000" />
              </LinearGradient>
              <Text style={styles.loadingText}>Carregando perfis...</Text>
              <Text style={styles.loadingSubtext}>Encontrando pessoas incríveis para você</Text>
            </View>
          ) : profilesError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
              <Text style={styles.errorTitle}>Erro ao carregar perfis</Text>
              <Text style={styles.errorMessage}>{profilesError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => loadProfiles(eventId)}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : currentProfile ? (
            profiles.map((profile, index) => renderProfileCard(profile, index))
          ) : (
            renderEmptyState()
          )}
        </Animated.View>

                  {/* Action Buttons */}
          {currentProfile && (
            <Animated.View 
              style={[
                styles.actionsContainer,
                {
                  transform: [{ scale: buttonScale }],
                  backgroundColor: '#252525',
                  borderTopWidth: 1,
                  borderTopColor: '#333333'
                },
              ]}
            >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSwipe('pass')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="close" size={28} color="#ef4444" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.superLikeButton}
              onPress={() => Alert.alert('⭐ Super Like', 'Funcionalidade em desenvolvimento!')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.1)']}
                style={styles.superLikeGradient}
              >
                <Ionicons name="star" size={24} color="#3b82f6" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSwipe('like')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.brand.primary, '#FFD700', '#FFA000']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="heart" size={28} color="#000000" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Match Modal */}
        {renderMatchModal()}
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
    paddingTop: Platform.OS === 'ios' ? spacing.sm : spacing.lg,
    paddingBottom: spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    ...Platform.select({
      ios: {
        shadowColor: colors.brand.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    letterSpacing: 0.5,
  },
  matchesBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.background,
  },
  matchesBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSizes.lg,
    color: 'white',
    fontWeight: typography.fontWeights.medium,
  },
  card: {
    position: 'absolute',
    width: width - spacing.lg * 2,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardGradient: {
    flex: 1,
    borderRadius: borderRadius.xl,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  verifiedText: {
    fontSize: typography.fontSizes.xs,
    color: '#22c55e',
    fontWeight: typography.fontWeights.semibold,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    fontSize: typography.fontSizes.xs,
    color: '#22c55e',
    fontWeight: typography.fontWeights.semibold,
  },
  swipeIndicator: {
    position: 'absolute',
    top: '40%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 3,
  },
  likeIndicator: {
    right: spacing.xl,
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  passIndicator: {
    left: spacing.xl,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  swipeIndicatorText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.extrabold,
    color: 'white',
    letterSpacing: 2,
  },
  infoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    justifyContent: 'flex-end',
  },
  profileInfo: {
    padding: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  profileName: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
    marginRight: spacing.sm,
  },
  profileAge: {
    fontSize: typography.fontSizes.lg,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeights.medium,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  distanceText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  profileBio: {
    fontSize: typography.fontSizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  interestText: {
    fontSize: typography.fontSizes.xs,
    color: '#9E7D00',
    fontWeight: typography.fontWeights.semibold,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  superLikeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  superLikeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
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
  emptyActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emptyActionSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActionSecondaryText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: 'white',
  },
  emptyActionPrimary: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  emptyActionPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 48,
  },
  emptyActionPrimaryText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: '#000000',
  },

  // Match Modal
  matchModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  matchModal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  matchModalContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  matchAnimation: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  matchIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.brand.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  floatingHearts: {
    position: 'absolute',
    width: 120,
    height: 120,
    top: -20,
    left: -20,
  },
  floatingHeart1: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  floatingHeart2: {
    position: 'absolute',
    top: 20,
    right: 15,
  },
  floatingHeart3: {
    position: 'absolute',
    bottom: 25,
    left: 20,
  },
  matchTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  matchSubtitle: {
    fontSize: typography.fontSizes.md,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  matchProfiles: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  matchProfileContainer: {
    alignItems: 'center',
  },
  matchProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  matchProfileName: {
    fontSize: typography.fontSizes.sm,
    color: 'white',
    fontWeight: typography.fontWeights.medium,
  },
  matchHeart: {
    marginHorizontal: spacing.md,
  },
  matchHeartGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  matchActionSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  matchActionSecondaryText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: 'white',
  },
  matchActionPrimary: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  matchActionPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 48,
  },
  matchActionPrimaryText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: '#000000',
  },

  // Loading and Error States
  loadingIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingSubtext: {
    fontSize: typography.fontSizes.sm,
    color: '#999999',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.fontSizes.md,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  retryButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: '#000000',
  },
  
  // 🎨 Novos estilos para header actions
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default EvenLoveMainScreen; 