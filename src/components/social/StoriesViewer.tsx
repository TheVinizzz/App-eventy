import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, TapGestureHandler, LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../theme';
import { socialService, Story } from '../../services/socialService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 segundos por story

interface GroupedStories {
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

interface StoriesViewerProps {
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

export const StoriesViewer: React.FC<StoriesViewerProps> = ({
  visible,
  onClose,
  groupedStories,
  initialUserIndex = 0,
  currentUser,
  onStoryDeleted,
}) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showingAlert, setShowingAlert] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [animationStartTime, setAnimationStartTime] = useState(0);
  
  // Animated values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Refs
  const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const tapRef = useRef<TapGestureHandler>(null);
  const panRef = useRef<PanGestureHandler>(null);
  const longPressRef = useRef<LongPressGestureHandler>(null);

  // Ordenar stories do mais antigo para o mais novo
  const sortedGroupedStories = groupedStories.map(group => ({
    ...group,
    stories: [...group.stories].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }));

  const currentUserStories = sortedGroupedStories[currentUserIndex];
  const currentStory = currentUserStories?.stories[currentStoryIndex];

  // Progress animation
  const startProgress = useCallback(() => {
    if (isHolding || !currentStory || showingAlert) return;
    
    // Parar animação anterior se existir
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
    
    // Calcular tempo restante baseado no progresso atual
    const remainingDuration = STORY_DURATION * (1 - currentProgress);
    
    // Se não há progresso, começar do zero
    if (currentProgress === 0) {
      progressAnim.setValue(0);
      setAnimationStartTime(Date.now());
    } else {
      // Continuar do ponto atual
      progressAnim.setValue(currentProgress);
    }
    
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    });
    
    progressAnimation.current = animation;
    
    animation.start(({ finished }) => {
      if (finished && !isHolding && !showingAlert) {
        nextStory();
      }
    });
    
    return animation;
  }, [currentStory, isHolding, showingAlert, currentProgress]);

  // Reset progress
  const resetProgress = useCallback(() => {
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
    progressAnim.setValue(0);
    setCurrentProgress(0);
    setAnimationStartTime(0);
  }, []);

  // Next story
  const nextStory = useCallback(() => {
    if (!currentUserStories) return;
    
    resetProgress();
    
    if (currentStoryIndex < currentUserStories.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      // Next user
      if (currentUserIndex < sortedGroupedStories.length - 1) {
        setCurrentUserIndex(prev => prev + 1);
        setCurrentStoryIndex(0);
      } else {
        onClose();
      }
    }
  }, [currentUserIndex, currentStoryIndex, currentUserStories, sortedGroupedStories.length, onClose, resetProgress]);

  // Previous story
  const previousStory = useCallback(() => {
    resetProgress();
    
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      // Previous user
      if (currentUserIndex > 0) {
        const prevUserIndex = currentUserIndex - 1;
        setCurrentUserIndex(prevUserIndex);
        setCurrentStoryIndex(sortedGroupedStories[prevUserIndex].stories.length - 1);
      }
    }
  }, [currentUserIndex, currentStoryIndex, sortedGroupedStories, resetProgress]);

  // Handle tap
  const handleTap = useCallback((event: any) => {
    const { x } = event.nativeEvent;
    const tapZone = SCREEN_WIDTH / 3;
    
    if (x < tapZone) {
      previousStory();
    } else if (x > tapZone * 2) {
      nextStory();
    }
    // Removed middle tap pause - now only hold to pause
  }, [nextStory, previousStory]);

  // Handle long press gesture state
  const handleLongPress = useCallback((event: any) => {
    const { state } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      // Salvar progresso atual quando pausar
      if (progressAnimation.current) {
        progressAnimation.current.stop();
        // Calcular progresso baseado no tempo decorrido
        const currentTime = Date.now();
        const elapsedTime = currentTime - animationStartTime;
        const newProgress = Math.min(currentProgress + (elapsedTime / STORY_DURATION), 1);
        setCurrentProgress(newProgress);
      }
      setIsHolding(true);
    } else if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      setIsHolding(false);
    }
  }, [animationStartTime, currentProgress]);

  // Handle pan gesture (horizontal e vertical)
  const handlePanGesture = useCallback((event: any) => {
    const { translationX, translationY, velocityX, velocityY, state } = event.nativeEvent;
    
    if (state === State.ACTIVE) {
      // Swipe vertical para baixo - fechar
      if (translationY > 100 && Math.abs(velocityY) > Math.abs(velocityX)) {
        translateY.setValue(translationY);
        scale.setValue(1 - translationY / SCREEN_HEIGHT * 0.3);
      }
    } else if (state === State.END) {
      // Swipe para baixo - fechar
      if (translationY > 150 || velocityY > 1000) {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
        return;
      }
      
      // Reset position se não fechou
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Swipe horizontal - trocar usuário
      if (Math.abs(translationX) > 50 || Math.abs(velocityX) > 500) {
        if (translationX > 0) {
          // Swipe right - previous user
          if (currentUserIndex > 0) {
            setCurrentUserIndex(prev => prev - 1);
            setCurrentStoryIndex(0);
          }
        } else {
          // Swipe left - next user
          if (currentUserIndex < sortedGroupedStories.length - 1) {
            setCurrentUserIndex(prev => prev + 1);
            setCurrentStoryIndex(0);
          } else {
            onClose();
          }
        }
      }
    }
  }, [currentUserIndex, sortedGroupedStories.length, onClose]);

  const handleDeleteStory = useCallback(async () => {
    if (!currentStory) return;
    
    // Capturar o story atual no momento do click para evitar problemas de timing
    const storyToDelete = currentStory;
    const userStoriesToDelete = currentUserStories;
    const currentIndexToDelete = currentStoryIndex;
    const userIndexToDelete = currentUserIndex;
    
    setShowingAlert(true);
    
    Alert.alert(
      'Deletar Story',
      'Tem certeza que deseja deletar este story?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setShowingAlert(false),
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await socialService.deleteStory(storyToDelete.id);
              
              // Notificar o componente pai
              if (onStoryDeleted) {
                onStoryDeleted(storyToDelete.id);
              }
              
              // Se era o último story do usuário, ir para o próximo usuário ou fechar
              if (userStoriesToDelete.stories.length === 1) {
                if (userIndexToDelete < sortedGroupedStories.length - 1) {
                  setCurrentUserIndex(prev => prev + 1);
                  setCurrentStoryIndex(0);
                } else {
                  onClose();
                }
              } else {
                // Se não era o último story, ir para o próximo ou anterior
                if (currentIndexToDelete < userStoriesToDelete.stories.length - 1) {
                  // Manter o índice atual (o próximo story vai ocupar a posição atual)
                } else {
                  // Era o último story do usuário, voltar para o anterior
                  setCurrentStoryIndex(prev => prev - 1);
                }
              }
            } catch (error) {
              console.error('Error deleting story:', error);
              Alert.alert('Erro', 'Não foi possível deletar o story. Tente novamente.');
            } finally {
              setIsLoading(false);
              setShowingAlert(false);
            }
          },
        },
      ]
    );
  }, [currentStory, currentUserStories, currentUserIndex, currentStoryIndex, sortedGroupedStories.length, onStoryDeleted, onClose]);

  // Mark story as viewed
  const markAsViewed = useCallback(async () => {
    if (currentStory && !currentStory.viewed) {
      try {
        await socialService.markStoryAsViewed(currentStory.id);
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    }
  }, [currentStory]);

  // Send reply
  const sendReply = useCallback(async () => {
    if (!replyText.trim() || !currentStory) return;
    
    try {
      setIsLoading(true);
      // Implementar envio de resposta
      // await socialService.replyToStory(currentStory.id, replyText.trim());
      
      setReplyText('');
      setShowReplyInput(false);
      setShowingAlert(false);
      Alert.alert('Sucesso', 'Resposta enviada!');
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Erro', 'Não foi possível enviar a resposta.');
    } finally {
      setIsLoading(false);
    }
  }, [replyText, currentStory]);

  // Effects
  useEffect(() => {
    if (visible && currentStory) {
      setCurrentProgress(0);
      setAnimationStartTime(Date.now());
      const animation = startProgress();
      markAsViewed();
      
      return () => {
        if (animation) {
          animation.stop();
        }
        resetProgress();
      };
    }
  }, [visible, currentStory, startProgress, resetProgress, markAsViewed]);

  useEffect(() => {
    if (isHolding || showingAlert) {
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
    } else if (visible && currentStory) {
      // Atualizar tempo de início da animação quando retomar
      setAnimationStartTime(Date.now());
      startProgress();
    }
  }, [isHolding, showingAlert, visible, currentStory, startProgress]);

  // Reset when user changes
  useEffect(() => {
    setCurrentStoryIndex(0);
    setCurrentProgress(0);
    setAnimationStartTime(0);
    resetProgress();
  }, [currentUserIndex, resetProgress]);

  // Reset position when modal opens/closes
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      scale.setValue(1);
    }
  }, [visible]);

  if (!visible || !currentUserStories || !currentStory) {
    return null;
  }

  // Função para formatar tempo mais precisa
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      <View style={styles.container}>
        <PanGestureHandler
          ref={panRef}
          onGestureEvent={handlePanGesture}
          onHandlerStateChange={handlePanGesture}
          simultaneousHandlers={[tapRef, longPressRef]}
        >
          <Animated.View 
            style={[
              styles.gestureContainer,
              {
                transform: [
                  { translateY: translateY },
                  { scale: scale }
                ],
              }
            ]}
          >
            <LongPressGestureHandler
              ref={longPressRef}
              onHandlerStateChange={handleLongPress}
              minDurationMs={100}
              simultaneousHandlers={[tapRef, panRef]}
            >
              <TapGestureHandler
                ref={tapRef}
                onActivated={handleTap}
                simultaneousHandlers={[panRef, longPressRef]}
                shouldCancelWhenOutside={true}
                maxDurationMs={300}
              >
                <Animated.View style={styles.storyContainer}>
                  {/* Background Image/Video */}
                  {currentStory.mediaType === 'IMAGE' ? (
                    <Image
                      source={{ uri: currentStory.mediaUrl }}
                      style={styles.storyMedia}
                      resizeMode="cover"
                    />
                  ) : (
                    <Video
                      source={{ uri: currentStory.mediaUrl }}
                      style={styles.storyMedia}
                      useNativeControls={false}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={!isHolding && !showingAlert}
                      isLooping={false}
                    />
                  )}
                  
                  {/* Gradient Overlay */}
                  <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.3)']}
                    style={styles.gradientOverlay}
                  />

                  {/* Progress Bars */}
                  <View style={styles.progressContainer}>
                    {currentUserStories.stories.map((_, index) => (
                      <View key={index} style={styles.progressBarContainer}>
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

                  {/* Header */}
                  <View style={styles.header}>
                    <View style={styles.userInfo}>
                      <View style={styles.avatar}>
                        {currentUserStories.user.profileImage ? (
                          <Image
                            source={{ uri: currentUserStories.user.profileImage }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Ionicons name="person" size={20} color="white" />
                        )}
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{currentUserStories.user.name}</Text>
                        <Text style={styles.timeAgo}>{formatTimeAgo(currentStory.createdAt)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.headerActions}>
                      {currentUserStories.user.id === currentUser.id && (
                        <TouchableOpacity
                          style={styles.headerButton}
                          onPressIn={(e) => {
                            e.stopPropagation();
                            e.preventDefault?.();
                            handleDeleteStory();
                          }}
                          delayPressIn={0}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash" size={20} color="white" />
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity
                        style={styles.headerButton}
                        onPressIn={(e) => {
                          e.stopPropagation();
                          e.preventDefault?.();
                          onClose();
                        }}
                        delayPressIn={0}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Story Content */}
                  {currentStory.textOverlay && (
                    <View style={styles.textOverlay}>
                      <Text
                        style={[
                          styles.overlayText,
                          {
                            color: currentStory.textColor || 'white',
                            fontSize: currentStory.textSize || 24,
                          }
                        ]}
                      >
                        {currentStory.textOverlay}
                      </Text>
                    </View>
                  )}

                  {/* Bottom Actions */}
                  <View style={styles.bottomActions}>
                    {currentUserStories.user.id !== currentUser.id && (
                      <TouchableOpacity
                        style={styles.replyButton}
                        onPressIn={(e) => {
                          e.stopPropagation();
                          e.preventDefault?.();
                          setShowingAlert(true);
                          setShowReplyInput(true);
                        }}
                        delayPressIn={0}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="chatbubble-outline" size={24} color="white" />
                        <Text style={styles.replyButtonText}>Responder</Text>
                      </TouchableOpacity>
                    )}
                    
                    <View style={styles.viewsContainer}>
                      <Ionicons name="eye" size={16} color="white" />
                      <Text style={styles.viewsText}>{currentStory._count.views}</Text>
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
                            <Ionicons name="send" size={20} color="white" />
                          )}
                        </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.cancelReplyButton}
                        onPress={() => {
                          setShowReplyInput(false);
                          setReplyText('');
                          setShowingAlert(false);
                        }}
                      >
                        <Text style={styles.cancelReplyText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Swipe Down Indicator */}
                  <View style={styles.swipeIndicator}>
                    <View style={styles.swipeHandle} />
                  </View>
                </Animated.View>
              </TapGestureHandler>
            </LongPressGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  gestureContainer: {
    flex: 1,
  },
  storyContainer: {
    flex: 1,
    position: 'relative',
  },
  storyMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20,
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: 'white',
  },
  timeAgo: {
    fontSize: typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  textOverlay: {
    position: 'absolute',
    top: '50%',
    left: spacing.lg,
    right: spacing.lg,
    transform: [{ translateY: -50 }],
    alignItems: 'center',
  },
  overlayText: {
    textAlign: 'center',
    fontWeight: typography.fontWeights.bold,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomActions: {
    position: 'absolute',
    bottom: spacing.xl + 40,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  replyButtonText: {
    color: 'white',
    marginLeft: spacing.sm,
    fontSize: typography.fontSizes.sm,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    color: 'white',
    marginLeft: spacing.xs,
    fontSize: typography.fontSizes.sm,
  },
  replyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: spacing.lg,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  replyInput: {
    flex: 1,
    color: 'white',
    fontSize: typography.fontSizes.md,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  cancelReplyButton: {
    alignSelf: 'center',
  },
  cancelReplyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.fontSizes.sm,
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeHandle: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
});