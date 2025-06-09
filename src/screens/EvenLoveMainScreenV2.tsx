import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Animated, 
  Dimensions, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useEvenLove } from '../contexts/EvenLoveContextV2';
import { EvenLoveProfile } from '../types/evenLove';

const { width, height } = Dimensions.get('window');

type EvenLoveMainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EvenLoveMain'>;
type EvenLoveMainScreenRouteProp = RouteProp<RootStackParamList, 'EvenLoveMain'>;

interface Props {
  navigation: EvenLoveMainScreenNavigationProp;
  route: EvenLoveMainScreenRouteProp;
}

// 🎨 COMPONENTE PRINCIPAL DE ALTA PERFORMANCE
const EvenLoveMainScreenV2: React.FC<Props> = ({ navigation, route }) => {
  const { eventId } = route.params;
  
  // 🚀 CONTEXTO AVANÇADO
  const { 
    state,
    isLoading,
    hasError,
    currentProfile,
    hasMoreProfiles,
    initializeEvent,
    swipeProfile,
    refreshData,
  } = useEvenLove();

  // 🎯 ESTADO LOCAL OTIMIZADO
  const [isInitialized, setIsInitialized] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState<EvenLoveProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 🎭 ANIMAÇÕES OTIMIZADAS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;
  const matchModalScale = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // 🔄 INICIALIZAÇÃO ÚNICA E CONTROLADA
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 EvenLove V2: Inicializando pela primeira vez');
      
      const initializeApp = async () => {
        try {
          await initializeEvent(eventId);
          setIsInitialized(true);
          
          // Animação de entrada suave
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
          
        } catch (error) {
          console.error('❌ EvenLove V2: Erro na inicialização:', error);
        }
      };

      initializeApp();
    }
  }, [isInitialized, eventId, initializeEvent, fadeAnim, scaleAnim]);

  // 🎯 MEMOIZAÇÃO INTELIGENTE
  const profileStats = useMemo(() => {
    if (!currentProfile) return null;
    
    return {
      age: currentProfile.age,
      interests: currentProfile.interests?.length || 0,
      photos: currentProfile.photos?.length || 0,
    };
  }, [currentProfile]);

  const navigationActions = useMemo(() => ({
    goToProfile: () => navigation.navigate('EvenLoveEntry', { eventId, eventTitle: 'Editar Perfil EvenLove' }),
    goToMatches: () => navigation.navigate('EvenLoveMatches', { eventId }),
    goToSettings: () => navigation.navigate('EvenLoveMatches', { eventId }), // Use matches for now
    goBack: () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    },
  }), [navigation, eventId]);

  // 🎬 SISTEMA DE SWIPE AVANÇADO
  const handleSwipe = async (action: 'pass' | 'like' | 'super_like') => {
    if (!currentProfile || actionLoading) return;

    setActionLoading(true);
    
    // Animação de botão
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
      // Animação de swipe
      const direction = action === 'like' || action === 'super_like' ? 1 : -1;
      
      Animated.parallel([
        Animated.timing(cardTranslateX, {
          toValue: direction * width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardRotate, {
          toValue: direction * 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Executar swipe
      const result = await swipeProfile(eventId, currentProfile.id, action);
      
      if (result.isMatch && result.match) {
        setLastMatch(currentProfile);
        setShowMatchModal(true);
        
        Animated.spring(matchModalScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }

      // Reset animações
      setTimeout(() => {
        cardTranslateX.setValue(0);
        cardRotate.setValue(0);
        fadeAnim.setValue(1);
      }, 300);

    } catch (error) {
      console.error('❌ EvenLove V2: Erro no swipe:', error);
      Alert.alert('Erro', 'Ocorreu um erro. Tente novamente.');
      
      // Reset animações em caso de erro
      cardTranslateX.setValue(0);
      cardRotate.setValue(0);
      fadeAnim.setValue(1);
    } finally {
      setActionLoading(false);
    }
  };

  // 🎭 MODAL DE MATCH
  const closeMatchModal = () => {
    Animated.timing(matchModalScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowMatchModal(false);
      setLastMatch(null);
    });
  };

  // 🔄 REFRESH INTELIGENTE
  const handleRefresh = async () => {
    try {
      await refreshData(eventId);
    } catch (error) {
      console.error('❌ EvenLove V2: Erro no refresh:', error);
    }
  };

  // 🎨 RENDERIZAÇÃO CONDICIONAL INTELIGENTE
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Carregando EvenLove...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <Ionicons name="heart-dislike" size={60} color="#fff" />
          <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
          <Text style={styles.errorMessage}>
            {state.profilesError || state.profileError || 'Erro desconhecido'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={navigationActions.goBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  if (!currentProfile) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <Ionicons name="heart-outline" size={80} color="#fff" />
          <Text style={styles.emptyTitle}>Nenhum perfil encontrado</Text>
          <Text style={styles.emptyMessage}>
            Você já viu todos os perfis disponíveis para este evento!
          </Text>
          <TouchableOpacity style={styles.matchesButton} onPress={navigationActions.goToMatches}>
            <Text style={styles.matchesButtonText}>Ver Meus Matches</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={navigationActions.goBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 🎨 BACKGROUND GRADIENTE */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* 📱 HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={navigationActions.goBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>EvenLove</Text>
          
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={navigationActions.goToMatches} style={styles.headerButton}>
              <Ionicons name="heart" size={24} color="#fff" />
              {state.unreadMatchesCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{state.unreadMatchesCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={navigationActions.goToProfile} style={styles.headerButton}>
              <Ionicons name="person" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 🃏 CARD DE PERFIL */}
        <Animated.View 
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateX: cardTranslateX },
                { rotate: cardRotate.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-30deg', '30deg'],
                })},
              ],
            },
          ]}
        >
          <View style={styles.card}>
            {/* 🖼️ IMAGEM DE PERFIL */}
            <View style={styles.imageContainer}>
              {currentProfile.photos && currentProfile.photos.length > 0 ? (
                <Image
                  source={{ uri: currentProfile.photos[0] }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={60} color="#ccc" />
                </View>
              )}
              
              {/* 🎯 OVERLAY DE INFORMAÇÕES */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.imageOverlay}
              >
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {currentProfile.displayName}
                    {profileStats?.age && (
                      <Text style={styles.profileAge}> {profileStats.age}</Text>
                    )}
                  </Text>
                  
                  {currentProfile.bio && (
                    <Text style={styles.profileBio} numberOfLines={2}>
                      {currentProfile.bio}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* 🏷️ INTERESSES */}
            {currentProfile.interests && currentProfile.interests.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.interestsContainer}
              >
                {currentProfile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Animated.View>

        {/* 🎮 BOTÕES DE AÇÃO */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={() => handleSwipe('pass')}
            disabled={actionLoading}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Ionicons name="close" size={30} color="#ff4458" />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleSwipe('like')}
            disabled={actionLoading}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Ionicons name="heart" size={30} color="#66d7d2" />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.superLikeButton]}
            onPress={() => handleSwipe('super_like')}
            disabled={actionLoading}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Ionicons name="star" size={30} color="#ffd700" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* 📊 INDICADOR DE PROGRESSO */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((state.currentProfileIndex + 1) / state.profiles.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {state.currentProfileIndex + 1} de {state.profiles.length}
          </Text>
        </View>
      </LinearGradient>

      {/* 🎉 MODAL DE MATCH */}
      {showMatchModal && lastMatch && (
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.matchModal,
              { transform: [{ scale: matchModalScale }] }
            ]}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a24']}
              style={styles.matchGradient}
            >
              <Ionicons name="heart" size={60} color="#fff" />
              <Text style={styles.matchTitle}>É um Match! 💕</Text>
              <Text style={styles.matchMessage}>
                Você e {lastMatch.displayName} curtiram um ao outro!
              </Text>
              
              <View style={styles.matchActions}>
                <TouchableOpacity 
                  style={styles.matchButton}
                  onPress={() => {
                    closeMatchModal();
                    navigationActions.goToMatches();
                  }}
                >
                  <Text style={styles.matchButtonText}>Enviar Mensagem</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.matchButton, styles.matchButtonSecondary]}
                  onPress={closeMatchModal}
                >
                  <Text style={[styles.matchButtonText, styles.matchButtonTextSecondary]}>
                    Continuar Vendo
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      )}

      {/* 🔄 LOADING OVERLAY */}
      {(isLoading || actionLoading) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingOverlayText}>
              {actionLoading ? 'Processando...' : 'Carregando...'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
  },
  retryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  matchesButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
  },
  matchesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4458',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: width - 40,
    height: height * 0.6,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  profileInfo: {
    marginBottom: 10,
  },
  profileName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileAge: {
    fontWeight: '400',
  },
  profileBio: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    lineHeight: 22,
  },
  interestsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    maxHeight: 60,
  },
  interestTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  interestText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  passButton: {
    backgroundColor: '#fff',
  },
  likeButton: {
    backgroundColor: '#fff',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  superLikeButton: {
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModal: {
    width: width - 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  matchGradient: {
    padding: 30,
    alignItems: 'center',
  },
  matchTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  matchMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  matchActions: {
    width: '100%',
    gap: 15,
  },
  matchButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  matchButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
  },
  matchButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
  matchButtonTextSecondary: {
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlayText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
  },
});

export default EvenLoveMainScreenV2; 