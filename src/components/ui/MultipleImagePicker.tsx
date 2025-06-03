import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import imageService from '../../services/imageService';

interface MultipleImagePickerProps {
  onImagesSelected: (imageUrls: string[]) => void;
  placeholder?: string;
  style?: any;
  error?: string;
  currentImageUrls?: string[];
  maxImages?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = (screenWidth - spacing.lg * 3) / 2;

const MultipleImagePicker: React.FC<MultipleImagePickerProps> = ({
  onImagesSelected,
  placeholder = "Adicionar imagens",
  style,
  error,
  currentImageUrls = [],
  maxImages = 5,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>(currentImageUrls);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para acessar suas fotos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showImagePickerOptions = () => {
    if (selectedImages.length >= maxImages) {
      Alert.alert(
        'Limite atingido',
        `Você pode adicionar no máximo ${maxImages} imagens.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Selecionar Imagens',
      'Escolha uma opção:',
      [
        {
          text: 'Câmera',
          onPress: openCamera,
        },
        {
          text: 'Galeria',
          onPress: openGallery,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para usar a câmera.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0]);
    }
  };

  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: maxImages - selectedImages.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      for (const asset of result.assets) {
        await handleImageSelected(asset);
      }
    }
  };

  const handleImageSelected = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploading(true);
      const newIndex = selectedImages.length;
      setUploadingIndex(newIndex);

      // Add placeholder image immediately for better UX
      const newImages = [...selectedImages, asset.uri];
      setSelectedImages(newImages);

      // Generate filename
      const timestamp = Date.now();
      const filename = `event-${timestamp}-${Math.random().toString(36).substr(2, 9)}.jpg`;

      // Upload image
      const imageUrl = await imageService.uploadEventImage(asset.uri, filename);
      
      // Replace placeholder with actual URL
      const updatedImages = [...selectedImages, imageUrl];
      setSelectedImages(updatedImages);
      onImagesSelected(updatedImages);

    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        'Erro',
        'Não foi possível enviar a imagem. Tente novamente.'
      );
      // Remove placeholder on error
      setSelectedImages(prev => prev.slice(0, -1));
    } finally {
      setIsUploading(false);
      setUploadingIndex(null);
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      'Remover Imagem',
      'Tem certeza que deseja remover esta imagem?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const newImages = selectedImages.filter((_, i) => i !== index);
            setSelectedImages(newImages);
            onImagesSelected(newImages);
          },
        },
      ]
    );
  };

  const moveToFirst = (index: number) => {
    if (index === 0) return;

    Alert.alert(
      'Definir como Capa',
      'Esta imagem será usada como capa principal do evento.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: () => {
            const newImages = [...selectedImages];
            const [movedImage] = newImages.splice(index, 1);
            newImages.unshift(movedImage);
            setSelectedImages(newImages);
            onImagesSelected(newImages);
          },
        },
      ]
    );
  };

  const renderImageItem = (imageUri: string, index: number) => {
    const isUploading = uploadingIndex === index;
    const isCover = index === 0;

    return (
      <View key={index} style={styles.imageItem}>
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        
        {/* Cover badge */}
        {isCover && (
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>CAPA</Text>
          </View>
        )}

        {/* Uploading overlay */}
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color={colors.brand.primary} />
          </View>
        )}

        {/* Action buttons */}
        {!isUploading && (
          <View style={styles.imageActions}>
            {!isCover && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => moveToFirst(index)}
              >
                <Ionicons name="star" size={16} color={colors.brand.primary} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close" size={16} color={colors.brand.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Add images button */}
      <TouchableOpacity
        style={[styles.addButton, error && styles.errorBorder]}
        onPress={showImagePickerOptions}
        disabled={isUploading || selectedImages.length >= maxImages}
      >
        <View style={styles.addButtonContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera" size={32} color={colors.brand.primary} />
          </View>
          <Text style={styles.placeholderText}>{placeholder}</Text>
          <Text style={styles.instructionText}>
            {selectedImages.length === 0 
              ? 'Toque para adicionar imagens do evento'
              : `${selectedImages.length}/${maxImages} imagens adicionadas`
            }
          </Text>
        </View>
      </TouchableOpacity>

      {/* Images grid */}
      {selectedImages.length > 0 && (
        <View style={styles.imagesContainer}>
          <Text style={styles.sectionTitle}>
            Imagens do Evento {selectedImages.length > 1 && '(Arraste para reordenar)'}
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesScrollContent}
          >
            {selectedImages.map((imageUri, index) => renderImageItem(imageUri, index))}
          </ScrollView>

          {selectedImages.length > 1 && (
            <Text style={styles.helpText}>
              A primeira imagem será usada como capa principal
            </Text>
          )}
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={colors.brand.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  addButton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.opacity.cardBorder,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  errorBorder: {
    borderColor: colors.brand.error,
  },
  addButtonContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  placeholderText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  imagesContainer: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
  },
  imagesScrollContent: {
    paddingHorizontal: spacing.sm,
  },
  imageItem: {
    position: 'relative',
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: imageWidth,
    height: imageWidth * 0.75,
    borderRadius: borderRadius.md,
  },
  coverBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  coverBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActions: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: spacing.xs,
  },
  removeButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
  },
  helpText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.error,
  },
});

export default MultipleImagePicker; 