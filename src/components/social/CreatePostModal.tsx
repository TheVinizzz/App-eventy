import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { socialService, CreatePostData } from '../../services/socialService';
import { searchEventsForMention, Event } from '../../services/eventsService';
import { uploadEventImage } from '../../services/imageService';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

interface EventSuggestion {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
  user,
}) => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventSuggestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);
  const [eventSuggestions, setEventSuggestions] = useState<EventSuggestion[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventQuery, setEventQuery] = useState('');
  const textInputRef = useRef<TextInput>(null);

  // Detectar @ no texto para mostrar sugestões de eventos
  useEffect(() => {
    const lastAtIndex = content.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = content.substring(lastAtIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      const newlineIndex = textAfterAt.indexOf('\n');
      const endIndex = spaceIndex === -1 ? newlineIndex : (newlineIndex === -1 ? spaceIndex : Math.min(spaceIndex, newlineIndex));
      const query = endIndex === -1 ? textAfterAt : textAfterAt.substring(0, endIndex);
      
      if (query.length > 0 && endIndex === -1) {
        setEventQuery(query);
        setShowEventSuggestions(true);
        searchEventsForMentionAPI(query);
      } else {
        setShowEventSuggestions(false);
      }
    } else {
      setShowEventSuggestions(false);
    }
  }, [content]);

  const searchEventsForMentionAPI = async (query: string) => {
    if (query.length < 1) return;
    
    setIsLoadingEvents(true);
    try {
      const events = await searchEventsForMention(query);
      
      const suggestions: EventSuggestion[] = events.map((event: Event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        imageUrl: event.imageUrl,
      }));
      
      setEventSuggestions(suggestions);
    } catch (error) {
      console.error('Error searching events:', error);
      setEventSuggestions([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleSelectEvent = (event: EventSuggestion) => {
    const lastAtIndex = content.lastIndexOf('@');
    const beforeAt = content.substring(0, lastAtIndex);
    const newContent = `${beforeAt}@${event.title} `;
    
    setContent(newContent);
    setSelectedEvent(event);
    setShowEventSuggestions(false);
    textInputRef.current?.focus();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar a câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !selectedImage) {
      Alert.alert('Erro', 'Adicione um texto ou imagem para criar o post.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedImageUrl: string | undefined = undefined;

      // Upload image to backend if selected
      if (selectedImage) {
        try {
          uploadedImageUrl = await uploadEventImage(selectedImage);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Erro', 'Não foi possível fazer upload da imagem. Tente novamente.');
          return;
        }
      }

      const postData: CreatePostData = {
        content: content.trim(),
        imageUrl: uploadedImageUrl,
        eventId: selectedEvent?.id,
      };

      const newPost = await socialService.createPost(postData);
      
      onPostCreated(newPost);
      handleClose();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Erro', 'Não foi possível criar o post. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setSelectedImage(null);
    setSelectedEvent(null);
    setShowEventSuggestions(false);
    setEventSuggestions([]);
    setEventQuery('');
    onClose();
  };

  const renderEventSuggestion = ({ item }: { item: EventSuggestion }) => (
    <TouchableOpacity
      style={styles.eventSuggestion}
      onPress={() => handleSelectEvent(item)}
    >
      <View style={styles.eventIcon}>
        <Ionicons name="calendar" size={16} color={colors.brand.primary} />
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.eventDetails} numberOfLines={1}>
          {new Date(item.date).toLocaleDateString('pt-BR')} • {item.location}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.brand.background, colors.brand.darkGray]}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Novo Post</Text>
            <TouchableOpacity
              onPress={handleCreatePost}
              disabled={(!content.trim() && !selectedImage) || isSubmitting}
              style={[
                styles.postButton,
                (!content.trim() && !selectedImage) && styles.postButtonDisabled
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.brand.background} />
              ) : (
                <Text style={styles.postButtonText}>Publicar</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color={colors.brand.textSecondary} />
                )}
              </View>
              <View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userSubtitle}>Compartilhando com a comunidade</Text>
              </View>
            </View>

            {/* Selected Event */}
            {selectedEvent && (
              <View style={styles.selectedEvent}>
                <Ionicons name="calendar" size={16} color={colors.brand.primary} />
                <Text style={styles.selectedEventText}>
                  Mencionando: {selectedEvent.title}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedEvent(null);
                    setContent(content.replace(`@${selectedEvent.title} `, ''));
                  }}
                  style={styles.removeEventButton}
                >
                  <Ionicons name="close" size={16} color={colors.brand.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Text Input */}
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder="O que está acontecendo?"
              placeholderTextColor={colors.brand.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              autoFocus
            />

            {/* Event Suggestions */}
            {showEventSuggestions && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Eventos sugeridos:</Text>
                {isLoadingEvents ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.brand.primary} />
                    <Text style={styles.loadingText}>Buscando eventos...</Text>
                  </View>
                ) : eventSuggestions.length > 0 ? (
                  <FlatList
                    data={eventSuggestions}
                    renderItem={renderEventSuggestion}
                    keyExtractor={(item) => item.id}
                    style={styles.suggestionsList}
                    keyboardShouldPersistTaps="always"
                  />
                ) : (
                  <Text style={styles.noSuggestionsText}>
                    Nenhum evento encontrado para "{eventQuery}"
                  </Text>
                )}
              </View>
            )}

            {/* Selected Image */}
            {selectedImage && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close" size={20} color={colors.brand.background} />
                </TouchableOpacity>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                <Ionicons name="image" size={24} color={colors.brand.primary} />
                <Text style={styles.actionText}>Galeria</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color={colors.brand.primary} />
                <Text style={styles.actionText}>Câmera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setContent(content + '@');
                  textInputRef.current?.focus();
                }}
              >
                <Ionicons name="at" size={24} color={colors.brand.primary} />
                <Text style={styles.actionText}>Mencionar</Text>
              </TouchableOpacity>
            </View>

            {/* Tip */}
            <Text style={styles.tip}>
              💡 Digite @ seguido do nome do evento para mencioná-lo
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  cancelButton: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  postButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: colors.brand.textSecondary,
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  userSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  selectedEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  selectedEventText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textPrimary,
    marginLeft: spacing.sm,
  },
  removeEventButton: {
    padding: spacing.xs,
  },
  textInput: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  suggestionsContainer: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  suggestionsTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  eventSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textPrimary,
  },
  eventDetails: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginLeft: spacing.sm,
  },
  noSuggestionsText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  selectedImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.opacity.cardBorder,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    marginLeft: spacing.sm,
  },
  tip: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontStyle: 'italic',
  },
}); 