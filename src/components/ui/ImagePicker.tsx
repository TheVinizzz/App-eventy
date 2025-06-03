import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import imageService from '../../services/imageService';

interface ImagePickerComponentProps {
  onImageSelected: (imageUrl: string) => void;
  placeholder?: string;
  style?: any;
  error?: string;
  currentImageUrl?: string;
}

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  onImageSelected,
  placeholder = "Adicionar imagem",
  style,
  error,
  currentImageUrl,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    Alert.alert(
      'Selecionar Imagem',
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
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0]);
    }
  };

  const handleImageSelected = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploading(true);
      setSelectedImage(asset.uri);

      // Generate filename
      const timestamp = Date.now();
      const filename = `event-${timestamp}.jpg`;

      // Upload image
      const imageUrl = await imageService.uploadEventImage(asset.uri, filename);
      
      // Call parent callback with the uploaded image URL
      onImageSelected(imageUrl);

      Alert.alert('Sucesso', 'Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        'Erro',
        'Não foi possível enviar a imagem. Tente novamente.'
      );
      setSelectedImage(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = () => {
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
            setSelectedImage(null);
            onImageSelected('');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {selectedImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
              <Text style={styles.uploadingText}>Enviando...</Text>
            </View>
          )}
          
          {!isUploading && (
            <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
              <Ionicons name="close-circle" size={24} color={colors.brand.error} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.pickerButton, error && styles.errorBorder]}
          onPress={showImagePickerOptions}
          disabled={isUploading}
        >
          <View style={styles.pickerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="camera" size={32} color={colors.brand.primary} />
            </View>
            <Text style={styles.placeholderText}>{placeholder}</Text>
            <Text style={styles.instructionText}>
              Toque para selecionar da galeria ou tirar uma foto
            </Text>
          </View>
        </TouchableOpacity>
      )}

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
  pickerButton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.opacity.cardBorder,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorBorder: {
    borderColor: colors.brand.error,
  },
  pickerContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  placeholderText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.sm * 1.4,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
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
    gap: spacing.sm,
  },
  uploadingText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textPrimary,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: spacing.xs,
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

export default ImagePickerComponent; 