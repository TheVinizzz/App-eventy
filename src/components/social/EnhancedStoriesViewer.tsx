import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  PanResponder,
  BackHandler,
  Alert,
  TextInput,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../theme';
import socialService, { Story } from '../../services/socialService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 segundos por story
const PROGRESS_HEIGHT = 3;

interface GroupedStories {
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

interface EnhancedStoriesViewerProps {
  visible: boolean;
  onClose: () => void;
  groupedStories: GroupedStories[];
  initialUserIndex?: number;
  currentUser: {
    id: string;
    name: string;
    profileImage?: string;
  };
  onStoryDeleted?: (storyId: string) => void;
}

export const EnhancedStoriesViewer: React.FC<EnhancedStoriesViewerProps> = ({
  visible,
  onClose,
  groupedStories,
  initialUserIndex = 0,
  currentUser,
  onStoryDeleted,
}) => {
  // Estados principais
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  
  // Estados para transição fluida de imagens (Instagram-level)
  const [currentImageLoaded, setCurrentImageLoaded] = useState(false);
  const [imageTransitioning, setImageTransitioning] = useState(false);

  // Animated values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  // Animação para transição suave de imagens
  const imageOpacity = useRef(new Animated.Value(1)).current;

  // Refs
  const videoRef = useRef<Video>(null);

  // Computed values
  const currentUserStories = useMemo(() => groupedStories[currentUserIndex], [groupedStories, currentUserIndex]);
  const currentStory = useMemo(() => currentUserStories?.stories[currentStoryIndex], [currentUserStories, currentStoryIndex]);
  const isOwner = useMemo(() => currentUser.id === currentUserStories?.user.id, [currentUser.id, currentUserStories?.user.id]);

  // Effect para sincronizar com o initialUserIndex quando o modal abrir (Instagram behavior)
  useEffect(() => {
    if (visible) {
      setCurrentUserIndex(initialUserIndex);
      setCurrentStoryIndex(0); // Sempre começar do primeiro story do usuário selecionado
    }
  }, [visible, initialUserIndex]);

  // Transição fluida e profissional de imagens (Instagram-level)
  const transitionToNewImage = useCallback(() => {
    setImageTransitioning(true);
    setCurrentImageLoaded(false);
    
    // Fade out instantâneo -> Imediatamente definir nova imagem
    imageOpacity.setValue(0);
    
    // Micro delay para garantir que o React renderize a nova imagem
    requestAnimationFrame(() => {
      // Fade in suave da nova imagem
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 150, // Transição suave de entrada
        useNativeDriver: true,
      }).start(() => {
        setImageTransitioning(false);
      });
    });
  }, []);

  // Preload inteligente das próximas imagens
  const preloadImages = useCallback(async () => {
    const imagesToPreload = [];
    
    // Próximas 3 stories do usuário atual
    for (let i = currentStoryIndex + 1; i <= currentStoryIndex + 3; i++) {
      if (currentUserStories?.stories[i]?.mediaType === 'IMAGE') {
        imagesToPreload.push(currentUserStories.stories[i].mediaUrl);
      }
    }
    
    // Primeiras 2 stories do próximo usuário
    if (groupedStories[currentUserIndex + 1]) {
      const nextUserStories = groupedStories[currentUserIndex + 1].stories.slice(0, 2);
      nextUserStories.forEach(story => {
        if (story.mediaType === 'IMAGE') {
          imagesToPreload.push(story.mediaUrl);
        }
      });
    }

    // Preload assíncrono
    // Preload assíncrono e agressivo com prioridade
    const preloadPromises = imagesToPreload.map(async (url) => {
      if (!preloadedImages.has(url)) {
        try {
          // Preload com prioridade alta
          await Image.prefetch(url);
          setPreloadedImages(prev => new Set(prev).add(url));
          return true;
        } catch (error) {
          console.log('Preload failed for:', url);
          return false;
        }
      }
      return true;
    });

    // Aguardar preload das próximas imagens importantes
    Promise.allSettled(preloadPromises);
  }, [currentUserIndex, currentStoryIndex, groupedStories, currentUserStories, preloadedImages]);

  // PanResponder para gestos intuitivos
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      // Swipe down para fechar
      if (gestureState.dy > 0) {
        dragY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      // Swipe down para fechar
      if (gestureState.dy > 150 || gestureState.vy > 0.5) {
        handleClose();
      }
      // Swipe horizontal para navegar
      else if (Math.abs(gestureState.dx) > 50) {
        if (gestureState.dx > 0) {
          previousStory();
        } else {
          nextStory();
        }
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Função para iniciar progresso com animação suave
  const startProgress = useCallback(() => {
    if (!currentStory || isPaused) return;

    // SEMPRE resetar o progresso para 0
    progressAnim.setValue(0);
    
    const duration = currentStory.mediaType === 'VIDEO' ? 15000 : STORY_DURATION;
    
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished && !isPaused) {
        nextStory();
      }
    });

    return animation;
  }, [currentStory, isPaused]);

  // Função para próxima story com lógica aprimorada
  const nextStory = useCallback(() => {
    // Parar animação atual ANTES de mudar
    progressAnim.stopAnimation();
    // Resetar para 0 imediatamente
    progressAnim.setValue(0);

    // Iniciar transição fluida da imagem
    transitionToNewImage();

    if (currentStoryIndex < currentUserStories.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < groupedStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      handleClose();
    }
  }, [currentStoryIndex, currentUserStories.stories.length, currentUserIndex, groupedStories.length, transitionToNewImage]);

  // Função para story anterior
  const previousStory = useCallback(() => {
    // Parar animação atual ANTES de mudar
    progressAnim.stopAnimation();
    // Resetar para 0 imediatamente
    progressAnim.setValue(0);

    // Iniciar transição fluida da imagem
    transitionToNewImage();

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      const prevUserStories = groupedStories[currentUserIndex - 1];
      setCurrentStoryIndex(prevUserStories.stories.length - 1);
    }
  }, [currentStoryIndex, currentUserIndex, groupedStories, transitionToNewImage]);

  // Função para lidar com toque na tela (Instagram style)
  const handleScreenTap = useCallback((evt: any) => {
    const { locationX } = evt.nativeEvent;
    const isRightSide = locationX > SCREEN_WIDTH / 2;

    if (isRightSide) {
      nextStory();
    } else {
      previousStory();
    }
  }, [nextStory, previousStory]);

  // Função para pausar/continuar
  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const newPaused = !prev;
      if (newPaused) {
        progressAnim.stopAnimation();
      } else {
        // Resetar progresso ao despausar (comportamento Instagram)
        progressAnim.setValue(0);
        startProgress();
      }
      return newPaused;
    });
  }, [startProgress]);

  // Função para fechar com animação
  const handleClose = useCallback(() => {
    progressAnim.stopAnimation();
    
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose]);

  // Função para enviar resposta
  const sendReply = useCallback(async () => {
    if (!replyText.trim() || !currentStory) return;

    setIsLoading(true);
    try {
      // Aqui você implementaria o envio da resposta
      // await socialService.replyToStory(currentStory.id, replyText);
      setReplyText('');
      setShowReplyInput(false);
      Alert.alert('✅ Sucesso', 'Resposta enviada!');
    } catch (error) {
      Alert.alert('❌ Erro', 'Não foi possível enviar a resposta');
    } finally {
      setIsLoading(false);
    }
  }, [replyText, currentStory]);

  // Controlar progresso
  useEffect(() => {
    if (visible && currentStory) {
      // Resetar progresso ANTES de iniciar o timeout
      progressAnim.setValue(0);
      
      const timeout = setTimeout(() => {
        startProgress();
      }, 100);
      return () => {
        clearTimeout(timeout);
        // Parar animação ao desmontrar ou mudar story
        progressAnim.stopAnimation();
      };
    }
  }, [visible, currentStory, currentUserIndex, currentStoryIndex, startProgress]);

  // Resetar estado da imagem quando muda de story
  useEffect(() => {
    if (visible && currentStory) {
      setCurrentImageLoaded(false);
      setImageTransitioning(false);
      imageOpacity.setValue(1);
    }
  }, [currentStory, visible]);

  // Preload das próximas imagens
  useEffect(() => {
    if (visible) {
      preloadImages();
    }
  }, [visible, currentUserIndex, currentStoryIndex, preloadImages]);

  // Animação de entrada
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Back handler
  useEffect(() => {
    if (visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible, handleClose]);

  if (!visible || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar backgroundColor="black" barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { scale: modalScale },
                { translateY: dragY }
              ]
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Background Media */}
          <View style={styles.mediaContainer}>
            {currentStory.mediaType === 'IMAGE' ? (
              <Animated.View style={[styles.media, { opacity: imageOpacity }]}>
                <Image
                  source={{ uri: currentStory.mediaUrl }}
                  style={styles.media}
                  resizeMode="cover"
                  onLoad={() => setCurrentImageLoaded(true)}
                  onLoadStart={() => setCurrentImageLoaded(false)}
                />
              </Animated.View>
            ) : (
              <Animated.View style={[styles.media, { opacity: imageOpacity }]}>
                <Video
                  ref={videoRef}
                  source={{ uri: currentStory.mediaUrl }}
                  style={styles.media}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={!isPaused}
                  isLooping={false}
                  isMuted={false}
                  onLoad={() => setCurrentImageLoaded(true)}
                  onLoadStart={() => setCurrentImageLoaded(false)}
                />
              </Animated.View>
            )}

            {/* Loading indicator sutil */}
            {(!currentImageLoaded || imageTransitioning) && (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.6)" />
              </View>
            )}
            
            {/* Gradient overlay */}
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.4)']}
              style={styles.gradientOverlay}
            />
          </View>

          {/* Touch Areas - Instagram style */}
          <TouchableOpacity
            style={styles.leftTouchArea}
            onPress={previousStory}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.rightTouchArea}
            onPress={nextStory}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.centerTouchArea}
            onPress={togglePause}
            activeOpacity={1}
          />

          {/* Progress Bars - Instagram style */}
          <View style={styles.progressContainer}>
            {currentUserStories.stories.map((_, index) => (
              <View key={index} style={styles.progressBar}>
                <View style={styles.progressBarBackground} />
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: index === currentStoryIndex
                        ? progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : index < currentStoryIndex ? '100%' : '0%'
                    }
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Header - Instagram style */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ 
                    uri: currentUserStories.user.profileImage || 'https://via.placeholder.com/40'
                  }}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{currentUserStories.user.name}</Text>
                <Text style={styles.timeAgo}>há 2h</Text>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              {isPaused && (
                <View style={styles.pauseIndicator}>
                  <Ionicons name="pause" size={14} color="white" />
                  <Text style={styles.pausedText}>Pausado</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Story Content */}
          {currentStory.textOverlay && (
            <View style={styles.textOverlay}>
              <Text style={styles.overlayText}>{currentStory.textOverlay}</Text>
            </View>
          )}

          {/* Bottom Actions - Instagram style */}
          <View style={styles.bottomActions}>
            {!isOwner && (
              <>
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => setShowReplyInput(true)}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                  <Text style={styles.replyText}>Responder</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.shareButton}>
                  <Ionicons name="paper-plane-outline" size={20} color="white" />
                </TouchableOpacity>
              </>
            )}
            
            <View style={styles.viewsContainer}>
              <Ionicons name="eye-outline" size={16} color="white" />
              <Text style={styles.viewsText}>{currentStory._count?.views || 0}</Text>
            </View>
          </View>

          {/* Reply Input */}
          {showReplyInput && (
            <View style={styles.replyContainer}>
              <View style={styles.replyInputContainer}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Responder..."
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={sendReply}
                  disabled={!replyText.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="send" size={18} color="white" />
                  )}
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowReplyInput(false);
                  setReplyText('');
                }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'black',
    position: 'relative',
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
    zIndex: 5,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  leftTouchArea: {
    position: 'absolute',
    left: 0,
    top: 100,
    bottom: 100,
    width: '25%',
    zIndex: 5,
  },
  rightTouchArea: {
    position: 'absolute',
    right: 0,
    top: 100,
    bottom: 100,
    width: '25%',
    zIndex: 5,
  },
  centerTouchArea: {
    position: 'absolute',
    left: '25%',
    right: '25%',
    top: 100,
    bottom: 100,
    zIndex: 5,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: PROGRESS_HEIGHT,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: PROGRESS_HEIGHT / 2,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderRadius: PROGRESS_HEIGHT / 2,
  },
  header: {
    position: 'absolute',
    top: 80,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.fontSizes.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pauseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
  },
  pausedText: {
    color: 'white',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.sm,
    borderRadius: 20,
  },
  textOverlay: {
    position: 'absolute',
    bottom: 150,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  overlayText: {
    color: 'white',
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 60,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 25,
    gap: spacing.sm,
  },
  replyText: {
    color: 'white',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  shareButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.sm,
    borderRadius: 20,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewsText: {
    color: 'white',
    fontSize: typography.fontSizes.sm,
  },
  replyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: 50,
    zIndex: 15,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  replyInput: {
    flex: 1,
    color: 'white',
    fontSize: typography.fontSizes.md,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.brand.primary,
    padding: spacing.sm,
    borderRadius: 18,
    marginLeft: spacing.sm,
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.fontSizes.md,
  },
});

export default EnhancedStoriesViewer;