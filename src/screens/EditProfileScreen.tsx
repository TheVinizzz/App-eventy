import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth, User } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

interface FormData {
  name: string;
  email: string;
  bio: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  profileImage?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  bio?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
}

const EditProfileScreen: React.FC = () => {
  const { user, updateUser, updateProfileImage } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    instagram: user?.instagram || '',
    tiktok: user?.tiktok || '',
    facebook: user?.facebook || '',
    profileImage: user?.profileImage,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Sincronizar formData com user quando ele muda
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        instagram: user.instagram || '',
        tiktok: user.tiktok || '',
        facebook: user.facebook || '',
        profileImage: user.profileImage,
      });
    }
  }, [user]);

  useEffect(() => {
    // Entrada animada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Detectar mudanças no formulário
    const currentData = {
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      instagram: user?.instagram || '',
      tiktok: user?.tiktok || '',
      facebook: user?.facebook || '',
      profileImage: user?.profileImage,
    };
    
    // Verificar se há mudanças reais nos dados
    const hasChangesNow = (
      formData.name.trim() !== currentData.name ||
      formData.email.trim() !== currentData.email ||
      formData.bio.trim() !== currentData.bio ||
      formData.instagram.trim() !== currentData.instagram ||
      formData.tiktok.trim() !== currentData.tiktok ||
      formData.facebook.trim() !== currentData.facebook ||
      formData.profileImage !== currentData.profileImage
    );
    
    setHasChanges(hasChangesNow);
  }, [formData, user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Nome obrigatório
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    // Email obrigatório e válido
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Bio máximo 200 caracteres
    if (formData.bio.length > 200) {
      newErrors.bio = 'Bio deve ter no máximo 200 caracteres';
    }
    
    // Validar redes sociais (opcional, mas se preenchido deve ser válido)
    if (formData.instagram && !formData.instagram.match(/^[a-zA-Z0-9._]+$/)) {
      newErrors.instagram = 'Username do Instagram inválido';
    }
    
    if (formData.tiktok && !formData.tiktok.match(/^[a-zA-Z0-9._]+$/)) {
      newErrors.tiktok = 'Username do TikTok inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // Validações básicas
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Erro', 'Email é obrigatório');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsLoading(true);
      
      // Preparar dados do usuário
      const userData: Partial<User> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim() || undefined,
        instagram: formData.instagram.trim() || undefined,
        tiktok: formData.tiktok.trim() || undefined,
        facebook: formData.facebook.trim() || undefined,
        profileImage: formData.profileImage,
      };

      console.log('🚀 EditProfile: Starting profile update with data:', userData);

      await updateUser(userData);
      
      console.log('✅ EditProfile: Profile updated successfully via API');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Voltar automaticamente sem toast
      navigation.goBack();
      
    } catch (error: any) {
      console.error('❌ EditProfile: Error updating profile:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Erro', 
        `Não foi possível salvar as alterações:\n${errorMessage}\n\nTente novamente.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurações', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        console.log('📸 Image selected, starting upload process...');
        
        try {
          // Upload image and update profile using context
          await updateProfileImage(result.assets[0].uri);
          
          console.log('✅ Profile image updated successfully');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          
        } catch (error: any) {
          console.error('❌ Error uploading profile image:', error);
          Alert.alert(
            'Erro no Upload', 
            `Não foi possível enviar a imagem:\n${error.message || 'Erro desconhecido'}`
          );
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setImageLoading(false);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Descartar Alterações?',
        'Você tem alterações não salvas. Deseja descartá-las?',
        [
          { text: 'Continuar Editando', style: 'cancel' },
          { 
            text: 'Descartar', 
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options: {
      placeholder?: string;
      multiline?: boolean;
      maxLength?: number;
      keyboardType?: 'default' | 'email-address' | 'numeric';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      leftIcon?: string;
      error?: string;
    } = {}
  ) => (
    <Animated.View 
      style={[
        styles.fieldContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[
        styles.inputContainer,
        options.error && styles.inputContainerError,
      ]}>
        {options.leftIcon && (
          <Ionicons 
            name={options.leftIcon as any} 
            size={20} 
            color={colors.brand.textSecondary}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[
            styles.textInput,
            options.multiline && styles.textInputMultiline,
            options.leftIcon && styles.textInputWithIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={options.placeholder}
          placeholderTextColor={colors.brand.textSecondary}
          multiline={options.multiline}
          maxLength={options.maxLength}
          keyboardType={options.keyboardType}
          autoCapitalize={options.autoCapitalize}
          autoCorrect={false}
        />
        {options.maxLength && (
          <Text style={styles.characterCount}>
            {value.length}/{options.maxLength}
          </Text>
        )}
      </View>
      {options.error && (
        <Text style={styles.errorText}>{options.error}</Text>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        
        <TouchableOpacity 
          style={[
            styles.saveButton,
            isLoading && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.brand.background} />
          ) : (
            <Text style={[
              styles.saveButtonText,
              isLoading && styles.saveButtonTextDisabled,
            ]}>
              Salvar
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image Section */}
          <Animated.View 
            style={[
              styles.imageSection,
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <View style={styles.imageContainer}>
              <TouchableOpacity 
                style={styles.avatarTouchable}
                onPress={handleImagePicker}
                disabled={imageLoading}
              >
                <View style={styles.avatar}>
                  {imageLoading ? (
                    <View style={styles.imageLoadingContainer}>
                      <ActivityIndicator size="large" color={colors.brand.primary} />
                    </View>
                  ) : formData.profileImage ? (
                    <Image 
                      source={{ uri: formData.profileImage }} 
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {formData.name ? getInitials(formData.name) : 'U'}
                      </Text>
                    </View>
                  )}
                  
                  <LinearGradient
                    colors={[colors.brand.primary, colors.brand.secondary]}
                    style={styles.cameraButton}
                  >
                    <Ionicons name="camera" size={20} color={colors.brand.background} />
                  </LinearGradient>
                </View>
              </TouchableOpacity>
              
              <Text style={styles.imageHint}>
                Toque para alterar sua foto de perfil
              </Text>
            </View>
          </Animated.View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Informações Básicas */}
            <Animated.View 
              style={[
                styles.sectionContainer,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <Text style={styles.sectionTitle}>Informações Básicas</Text>
              
              {renderFormField(
                'Nome Completo',
                formData.name,
                (text) => setFormData(prev => ({ ...prev, name: text })),
                {
                  placeholder: 'Digite seu nome completo',
                  leftIcon: 'person-outline',
                  error: errors.name,
                  autoCapitalize: 'words',
                }
              )}
              
              {renderFormField(
                'Email',
                formData.email,
                (text) => setFormData(prev => ({ ...prev, email: text })),
                {
                  placeholder: 'Digite seu email',
                  leftIcon: 'mail-outline',
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                  error: errors.email,
                }
              )}
              
              {renderFormField(
                'Biografia',
                formData.bio,
                (text) => setFormData(prev => ({ ...prev, bio: text })),
                {
                  placeholder: 'Conte um pouco sobre você...',
                  leftIcon: 'document-text-outline',
                  multiline: true,
                  maxLength: 200,
                  error: errors.bio,
                  autoCapitalize: 'sentences',
                }
              )}
            </Animated.View>

            {/* Redes Sociais */}
            <Animated.View 
              style={[
                styles.sectionContainer,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <Text style={styles.sectionTitle}>Redes Sociais</Text>
              <Text style={styles.sectionSubtitle}>Conecte suas redes sociais (opcional)</Text>
              
              {renderFormField(
                'Instagram',
                formData.instagram,
                (text) => setFormData(prev => ({ ...prev, instagram: text.replace('@', '') })),
                {
                  placeholder: 'seususername',
                  leftIcon: 'logo-instagram',
                  autoCapitalize: 'none',
                  error: errors.instagram,
                }
              )}
              
              {renderFormField(
                'TikTok',
                formData.tiktok,
                (text) => setFormData(prev => ({ ...prev, tiktok: text.replace('@', '') })),
                {
                  placeholder: 'seususername',
                  leftIcon: 'logo-tiktok',
                  autoCapitalize: 'none',
                  error: errors.tiktok,
                }
              )}
              
              {renderFormField(
                'Facebook',
                formData.facebook,
                (text) => setFormData(prev => ({ ...prev, facebook: text })),
                {
                  placeholder: 'Seu nome no Facebook',
                  leftIcon: 'logo-facebook',
                  autoCapitalize: 'words',
                  error: errors.facebook,
                }
              )}
            </Animated.View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveButtonDisabled: {
    backgroundColor: colors.brand.darkGray,
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  saveButtonTextDisabled: {
    color: colors.brand.textSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  imageContainer: {
    alignItems: 'center',
  },
  avatarTouchable: {
    marginBottom: spacing.md,
    padding: spacing.xs, // Adiciona espaço para o ícone não ser cortado
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    backgroundColor: colors.brand.darkGray,
    overflow: 'visible', // Permite que o ícone seja visível fora do avatar
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  imageLoadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.brand.background,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  imageHint: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginBottom: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.opacity.cardBorder,
  },
  inputContainerError: {
    borderColor: colors.brand.error,
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    zIndex: 1,
  },
  textInput: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  textInputWithIcon: {
    paddingLeft: spacing.md + 20 + spacing.sm,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  characterCount: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.error,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xxxl,
  },
});

export default EditProfileScreen; 