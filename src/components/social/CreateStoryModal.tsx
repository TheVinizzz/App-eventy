import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, typography, borderRadius } from '../../theme';
import socialService, { Story, CreateStoryData } from '../../services/socialService';
import { eventCommunityService } from '../../services/eventCommunityService';
import { uploadStoryMedia } from '../../services/imageService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  isEventCommunity?: boolean;
  eventInfo?: {
    title: string;
    id: string;
  };
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
}

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF4444', '#4CAF50', '#2196F3', 
  '#FF9800', '#9C27B0', '#FFD700', '#E91E63', '#00BCD4'
];

const BACKGROUND_COLORS = [
  'transparent', '#000000', '#FFFFFF', '#FF4444', '#4CAF50', 
  '#2196F3', '#FF9800', '#9C27B0', '#FFD700', '#E91E63'
];

const FONT_SIZES = [16, 20, 24, 28, 32, 36];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  visible,
  onClose,
  onStoryCreated,
  user,
  isEventCommunity = false,
  eventInfo,
}) => {
  const [step, setStep] = useState<'select' | 'edit' | 'preview'>('select');
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type: 'image' | 'video';
    duration?: number;
  } | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState('#FFFFFF');
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('transparent');
  const [selectedFontSize, setSelectedFontSize] = useState(24);
  const [selectedFontWeight, setSelectedFontWeight] = useState<'normal' | 'bold'>('normal');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Media selection
  const selectFromCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          duration: asset.duration || undefined,
        });
        setStep('edit');
        animateToEdit();
      }
    } catch (error) {
      console.error('Error selecting from camera:', error);
      Alert.alert('Erro', 'Não foi possível acessar a câmera.');
    }
  }, []);

  const selectFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar fotos e vídeos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          duration: asset.duration || undefined,
        });
        setStep('edit');
        animateToEdit();
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert('Erro', 'Não foi possível acessar a galeria.');
    }
  }, []);

  // Animations
  const animateToEdit = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim, scaleAnim]);

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetState();
      onClose();
    });
  }, [slideAnim, fadeAnim, scaleAnim, onClose]);

  // Text overlay management
  const addTextOverlay = useCallback(() => {
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: 'Toque para editar',
      x: SCREEN_WIDTH / 2 - 75,
      y: SCREEN_HEIGHT / 2 - 50,
      color: selectedTextColor,
      backgroundColor: selectedBackgroundColor,
      fontSize: selectedFontSize,
      fontWeight: selectedFontWeight,
    };
    setTextOverlays(prev => [...prev, newOverlay]);
    setActiveTextId(newOverlay.id);
    setCurrentText(newOverlay.text);
    setShowTextEditor(true);
  }, [selectedTextColor, selectedBackgroundColor, selectedFontSize, selectedFontWeight]);

  const updateTextOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  }, []);

  const deleteTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
    setActiveTextId(null);
  }, []);

  // Create pan responder for text dragging
  const createPanResponder = useCallback((overlayId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveTextId(overlayId);
      },
      onPanResponderMove: (_, gestureState) => {
        updateTextOverlay(overlayId, {
          x: gestureState.moveX - 75,
          y: gestureState.moveY - 25,
        });
      },
    });
  }, [updateTextOverlay]);

  // Story creation
  const createStory = useCallback(async () => {
    if (!selectedMedia) return;

    try {
      setIsLoading(true);
      
      let uploadedMediaUrl: string;

      // Upload media to backend first
      try {
        uploadedMediaUrl = await uploadStoryMedia(
          selectedMedia.uri,
          selectedMedia.type,
          `story-${Date.now()}.${selectedMedia.type === 'video' ? 'mp4' : 'jpg'}`
        );
      } catch (uploadError) {
        console.error('Error uploading media:', uploadError);
        Alert.alert('Erro', 'Não foi possível fazer upload da mídia. Tente novamente.');
        return;
      }
      
      // Prepare story data for backend
      const storyData: CreateStoryData = {
        mediaUrl: uploadedMediaUrl,
        mediaType: selectedMedia.type === 'video' ? 'video' : 'image',
        textOverlay: textOverlays.length > 0 ? textOverlays[0].text : undefined,
        textColor: textOverlays.length > 0 ? textOverlays[0].color : undefined,
        textSize: textOverlays.length > 0 ? textOverlays[0].fontSize : undefined,
        textPosition: textOverlays.length > 0 ? { 
          x: textOverlays[0].x, 
          y: textOverlays[0].y 
        } : undefined,
        backgroundColor: textOverlays.length > 0 ? textOverlays[0].backgroundColor : undefined,
      };

      // Call appropriate API based on context
      let newStory;
      if (isEventCommunity && eventInfo?.id) {
        console.log('Creating story in event community:', eventInfo.title);
        const communityStory = await eventCommunityService.createStory(
          eventInfo.id,
          uploadedMediaUrl,
          selectedMedia.type === 'video' ? 'VIDEO' : 'IMAGE',
          textOverlays.length > 0 ? textOverlays[0].text : undefined
        );
        
        // Normalizar para formato Story para compatibilidade
        newStory = {
          ...communityStory,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
          viewed: false,
          _count: {
            views: communityStory.viewsCount || 0
          }
        };
      } else {
        console.log('Creating story in general community');
        newStory = await socialService.createStory(storyData);
      }
      
      onStoryCreated(newStory as Story);
      animateClose();
    } catch (error) {
      console.error('Error creating story:', error);
      Alert.alert('Erro', 'Não foi possível criar o story. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMedia, textOverlays, onStoryCreated, animateClose]);

  const resetState = useCallback(() => {
    setStep('select');
    setSelectedMedia(null);
    setTextOverlays([]);
    setActiveTextId(null);
    setShowTextEditor(false);
    setCurrentText('');
    setSelectedTextColor('#FFFFFF');
    setSelectedBackgroundColor('transparent');
    setSelectedFontSize(24);
    setSelectedFontWeight('normal');
    slideAnim.setValue(SCREEN_HEIGHT);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
  }, [slideAnim, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      onRequestClose={animateClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {step === 'select' && (
        <LinearGradient
          colors={['#0A0A0A', '#1A1A1A', '#2A2A2A']}
          style={styles.container}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Criar Story</Text>
                {isEventCommunity && eventInfo && (
                  <View style={styles.eventBadge}>
                    <Ionicons name="calendar" size={12} color="#FFD700" />
                    <Text style={styles.eventBadgeText}>{eventInfo.title}</Text>
                  </View>
                )}
              </View>
              <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.selectContent}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[colors.brand.primary, colors.brand.secondary]}
                  style={styles.logoGradient}
                >
                  <Ionicons name="camera" size={40} color="black" />
                </LinearGradient>
                <Text style={styles.logoText}>Compartilhe seu momento</Text>
                <Text style={styles.logoSubtext}>Crie um story incrível para seus amigos</Text>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity style={styles.optionButton} onPress={selectFromCamera}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.optionGradient}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name="camera" size={32} color={colors.brand.primary} />
                    </View>
                    <Text style={styles.optionTitle}>Câmera</Text>
                    <Text style={styles.optionSubtitle}>Tire uma foto ou grave um vídeo</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionButton} onPress={selectFromGallery}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.optionGradient}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name="images" size={32} color={colors.brand.primary} />
                    </View>
                    <Text style={styles.optionTitle}>Galeria</Text>
                    <Text style={styles.optionSubtitle}>Escolha fotos ou vídeos salvos</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      )}

      {(step === 'edit' || step === 'preview') && selectedMedia && (
        <Animated.View 
          style={[
            styles.editContainer,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Background Media */}
          {selectedMedia.type === 'image' ? (
            <Image
              source={{ uri: selectedMedia.uri }}
              style={styles.backgroundMedia}
              resizeMode="cover"
            />
          ) : (
            <Video
              source={{ uri: selectedMedia.uri }}
              style={styles.backgroundMedia}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              shouldPlay={step === 'edit'}
              isLooping
            />
          )}

          {/* Dark Overlay */}
          <View style={styles.darkOverlay} />

          {/* Text Overlays */}
          {textOverlays.map((overlay) => (
            <Animated.View
              key={overlay.id}
              style={[
                styles.textOverlayContainer,
                {
                  left: overlay.x,
                  top: overlay.y,
                  borderColor: activeTextId === overlay.id ? colors.brand.primary : 'transparent',
                }
              ]}
              {...createPanResponder(overlay.id).panHandlers}
            >
              <TouchableOpacity
                onPress={() => {
                  setActiveTextId(overlay.id);
                  setCurrentText(overlay.text);
                  setSelectedTextColor(overlay.color);
                  setSelectedBackgroundColor(overlay.backgroundColor);
                  setSelectedFontSize(overlay.fontSize);
                  setSelectedFontWeight(overlay.fontWeight);
                  setShowTextEditor(true);
                }}
                onLongPress={() => deleteTextOverlay(overlay.id)}
              >
                <View
                  style={[
                    styles.textOverlayBackground,
                    { backgroundColor: overlay.backgroundColor }
                  ]}
                >
                  <Text
                    style={[
                      styles.textOverlay,
                      {
                        color: overlay.color,
                        fontSize: overlay.fontSize,
                        fontWeight: overlay.fontWeight,
                      }
                    ]}
                  >
                    {overlay.text}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* Top Controls */}
          <SafeAreaView style={styles.topControls}>
            <TouchableOpacity onPress={animateClose} style={styles.controlButton}>
              <BlurView intensity={20} style={styles.blurButton}>
                <Ionicons name="close" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={addTextOverlay} style={styles.controlButton}>
              <BlurView intensity={20} style={styles.blurButton}>
                <Ionicons name="text" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.publishButton}
              onPress={createStory}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={styles.publishGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="black" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="black" />
                    <Text style={styles.publishText}>Publicar Story</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Text Editor Modal */}
          {showTextEditor && (
            <BlurView intensity={50} style={styles.textEditorOverlay}>
              <View style={styles.textEditorContainer}>
                <Text style={styles.textEditorTitle}>Editar Texto</Text>
                
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: selectedTextColor,
                      backgroundColor: selectedBackgroundColor === 'transparent' ? 'rgba(255,255,255,0.1)' : selectedBackgroundColor,
                      fontSize: selectedFontSize,
                      fontWeight: selectedFontWeight,
                    }
                  ]}
                  value={currentText}
                  onChangeText={setCurrentText}
                  placeholder="Digite seu texto..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  multiline
                  autoFocus
                />

                {/* Color Picker */}
                <View style={styles.colorSection}>
                  <Text style={styles.sectionTitle}>Cor do Texto</Text>
                  <View style={styles.colorPicker}>
                    {TEXT_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          selectedTextColor === color && styles.selectedColor
                        ]}
                        onPress={() => setSelectedTextColor(color)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.colorSection}>
                  <Text style={styles.sectionTitle}>Fundo do Texto</Text>
                  <View style={styles.colorPicker}>
                    {BACKGROUND_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { 
                            backgroundColor: color === 'transparent' ? 'rgba(255,255,255,0.1)' : color,
                            borderWidth: color === 'transparent' ? 2 : 0,
                            borderColor: 'rgba(255,255,255,0.3)',
                          },
                          selectedBackgroundColor === color && styles.selectedColor
                        ]}
                        onPress={() => setSelectedBackgroundColor(color)}
                      >
                        {color === 'transparent' && (
                          <Ionicons name="close" size={16} color="white" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Font Controls */}
                <View style={styles.fontControls}>
                  <View style={styles.fontSection}>
                    <Text style={styles.sectionTitle}>Tamanho</Text>
                    <View style={styles.fontSizeOptions}>
                      {FONT_SIZES.map((size) => (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.fontSizeOption,
                            selectedFontSize === size && styles.selectedFontSize
                          ]}
                          onPress={() => setSelectedFontSize(size)}
                        >
                          <Text style={[styles.fontSizeText, { fontSize: size / 2 + 8 }]}>
                            {size}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fontSection}>
                    <Text style={styles.sectionTitle}>Estilo</Text>
                    <View style={styles.fontWeightOptions}>
                      <TouchableOpacity
                        style={[
                          styles.fontWeightOption,
                          selectedFontWeight === 'normal' && styles.selectedFontWeight
                        ]}
                        onPress={() => setSelectedFontWeight('normal')}
                      >
                        <Text style={styles.fontWeightText}>Normal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.fontWeightOption,
                          selectedFontWeight === 'bold' && styles.selectedFontWeight
                        ]}
                        onPress={() => setSelectedFontWeight('bold')}
                      >
                        <Text style={[styles.fontWeightText, { fontWeight: 'bold' }]}>Negrito</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.textEditorActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowTextEditor(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => {
                      if (activeTextId) {
                        updateTextOverlay(activeTextId, {
                          text: currentText,
                          color: selectedTextColor,
                          backgroundColor: selectedBackgroundColor,
                          fontSize: selectedFontSize,
                          fontWeight: selectedFontWeight,
                        });
                      }
                      setShowTextEditor(false);
                    }}
                  >
                    <LinearGradient
                      colors={[colors.brand.primary, colors.brand.secondary]}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>Salvar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          )}
        </Animated.View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl + 10,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  eventBadgeText: {
    fontSize: typography.fontSizes.xs,
    color: '#FFD700',
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeights.medium,
  },
  placeholder: {
    width: 40,
  },
  selectContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  logoSubtext: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * 1.4,
  },
  optionsContainer: {
    width: '100%',
    gap: spacing.lg,
  },
  optionButton: {
    width: '100%',
  },
  optionGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  optionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  editContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  textOverlayContainer: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: borderRadius.sm,
    borderStyle: 'dashed',
  },
  textOverlayBackground: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  textOverlay: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  controlButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  blurButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 20,
  },
  publishButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  publishGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  publishText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: 'black',
  },
  textEditorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  textEditorContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxHeight: '80%',
  },
  textEditorTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  colorSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: colors.brand.primary,
  },
  fontControls: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  fontSection: {
    flex: 1,
  },
  fontSizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  fontSizeOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  selectedFontSize: {
    backgroundColor: colors.brand.primary,
  },
  fontSizeText: {
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  fontWeightOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fontWeightOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    alignItems: 'center',
  },
  selectedFontWeight: {
    backgroundColor: colors.brand.primary,
  },
  fontWeightText: {
    color: colors.brand.textPrimary,
    fontSize: typography.fontSizes.sm,
  },
  textEditorActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.brand.textSecondary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'black',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
}); 