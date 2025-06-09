import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  TextInput,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { colors, spacing, typography, borderRadius } from '../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useEvenLove } from '../contexts/EvenLoveContext';
import { Gender } from '../types/evenLove';
import evenLoveService from '../services/evenLoveService';
import useEvenLoveProfilePersistence from '../hooks/useEvenLoveProfilePersistence';

const { width, height } = Dimensions.get('window');

type EvenLoveEntryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EvenLoveEntry'>;
type EvenLoveEntryScreenRouteProp = RouteProp<RootStackParamList, 'EvenLoveEntry'>;

interface ProfileFormData {
  displayName: string;
  age: string;
  gender: Gender | null;
  interestedInGenders: Gender[];
  bio: string;
  photos: string[];
  interests: string[];
  preferences: {
    minAge: number;
    maxAge: number;
    maxDistance: number;
  };
}

const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: 'masculine', label: 'Masculino', icon: 'man' },
  { value: 'feminine', label: 'Feminino', icon: 'woman' },
  { value: 'non-binary', label: 'Não-binário', icon: 'transgender' },
  { value: 'prefer_not_to_say', label: 'Prefiro não dizer', icon: 'help-circle' },
];

const INTEREST_OPTIONS = [
  'Música', 'Arte', 'Tecnologia', 'Esportes', 'Culinária', 'Viagens',
  'Fotografia', 'Cinema', 'Literatura', 'Natureza', 'Fitness', 'Games',
  'Dança', 'Moda', 'Empreendedorismo', 'Ciência', 'História', 'Idiomas'
];

const EvenLoveEntryScreen: React.FC = () => {
  const navigation = useNavigation<EvenLoveEntryScreenNavigationProp>();
  const route = useRoute<EvenLoveEntryScreenRouteProp>();
  const { eventId, eventTitle } = route.params;

  const { 
    profile, 
    isProfileLoading, 
    loadProfile, 
    createProfile,
    updateProfile,
    checkEligibility 
  } = useEvenLove();

  // 💾 Hook para persistir dados do formulário
  const {
    profileData: savedProfileData,
    isLoaded: isProfileDataLoaded,
    updateField,
    clearSavedData,
    hasSavedData,
  } = useEvenLoveProfilePersistence();

  const [step, setStep] = useState(0);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [eligibilityReason, setEligibilityReason] = useState<string>('');
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    age: '',
    gender: null,
    interestedInGenders: [],
    bio: '',
    photos: [],
    interests: [],
    preferences: {
      minAge: 18,
      maxAge: 50,
      maxDistance: 50,
    },
  });

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkUserEligibility();
  }, []);

  useEffect(() => {
    if (isEligible === true) {
      loadExistingProfile();
    }
  }, [isEligible]);

  // 🔧 Efeito específico para carregar dados no modo de edição
  useEffect(() => {
    const isEditMode = route.params.eventTitle?.includes('Editar');
    
    if (isEditMode && profile && isEligible === true) {
      console.log('📝 EvenLove: Preenchendo campos para edição - useEffect');
      
      setFormData({
        displayName: profile.displayName || '',
        age: (profile.user as any)?.birthDate ? calculateAge((profile.user as any).birthDate).toString() : '',
        gender: profile.gender || null,
        interestedInGenders: profile.interestedInGenders || [],
        bio: profile.bio || '',
        photos: profile.photos || [],
        interests: profile.interests || [],
        preferences: {
          minAge: profile.ageRangeMin || 18,
          maxAge: profile.ageRangeMax || 50,
          maxDistance: profile.maxDistance || 50,
        },
      });
      
      // 🎯 Garantir que a tela está visível para edição
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [profile, isEligible, route.params.eventTitle]);

  // Carregar dados salvos quando disponível
  useEffect(() => {
    if (isProfileDataLoaded && hasSavedData()) {
      console.log('📱 EvenLove: Carregando dados salvos do perfil');
      setFormData(savedProfileData as ProfileFormData);
      
      Alert.alert(
        '💾 Dados Salvos Encontrados',
        'Encontramos informações que você preencheu anteriormente. Deseja continuar de onde parou?',
        [
          {
            text: 'Começar do Zero',
            style: 'destructive',
            onPress: () => clearSavedData(),
          },
          {
            text: 'Continuar',
            style: 'default',
          },
        ]
      );
    }
  }, [isProfileDataLoaded, savedProfileData, hasSavedData]);

  useEffect(() => {
    // 🔧 CORREÇÃO: Só navegar automaticamente se NÃO for modo de edição
    const isEditMode = route.params.eventTitle?.includes('Editar');
    
    if (profile && !isEditMode) {
      // 🎯 Transição suave para usuários com perfil existente (somente quando não editando)
      console.log('📱 EvenLove: Perfil encontrado, navegando de volta para Main (não é edição)');
      
      const navigateWithTransition = () => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // 🔧 NAVEGAÇÃO CORRIGIDA: Usar replace para evitar pilha de navegação
          navigation.replace('EvenLoveMain', { eventId });
        });
      };
      
      // Se não é edição e tem perfil, mostrar transição suave
      setTimeout(navigateWithTransition, 500);
    } else if (isEditMode) {
      console.log('✏️ EvenLove: Modo de edição detectado, permanecendo na tela');
    }
  }, [profile, navigation, eventId, route.params.eventTitle]);

  const checkUserEligibility = async () => {
    try {
      setIsCheckingEligibility(true);
      const eligibility = await checkEligibility(eventId);
      setIsEligible(eligibility.isEligible);
      setEligibilityReason(eligibility.reason || '');
    } catch (error: any) {
      console.error('Error checking eligibility:', error);
      Alert.alert('Erro', 'Não foi possível verificar elegibilidade. Tente novamente.');
      navigation.goBack();
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const loadExistingProfile = async () => {
    try {
      await loadProfile(eventId);
      console.log('✅ EvenLove: Perfil carregado com sucesso');
    } catch (error) {
      console.error('❌ EvenLove: Erro ao carregar perfil:', error);
    }
  };

  // Função auxiliar para calcular idade
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const animateToStep = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: nextStep * -width,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleGenderSelection = (gender: Gender) => {
    setFormData(prev => ({ ...prev, gender }));
    updateField('gender', gender); // 💾 Salvar automaticamente
  };

  const handleInterestedGenderToggle = (gender: Gender) => {
    setFormData(prev => ({
      ...prev,
      interestedInGenders: prev.interestedInGenders.includes(gender)
        ? prev.interestedInGenders.filter(g => g !== gender)
        : [...prev.interestedInGenders, gender]
    }));
  };

  const handleInterestToggle = (interest: string) => {
    const newInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];
    
    setFormData(prev => ({ ...prev, interests: newInterests }));
    updateField('interests', newInterests); // 💾 Salvar automaticamente
  };

  const handlePhotoUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        const newPhotos = [...formData.photos, photoUri];
        
        setFormData(prev => ({ ...prev, photos: newPhotos }));
        updateField('photos', newPhotos); // 💾 Salvar automaticamente
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a foto.');
    }
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 0:
        return formData.gender !== null;
      case 1:
        return formData.interestedInGenders.length > 0;
      case 2:
        return formData.displayName.trim().length > 0 && parseInt(formData.age) >= 18;
      case 3:
        return formData.photos.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      Alert.alert('Informação obrigatória', 'Por favor, complete todas as informações obrigatórias.');
      return;
    }

    if (step < 5) {
      animateToStep(step + 1);
    } else {
      handleCreateProfile();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateToStep(step - 1);
    } else {
      // 🔧 NAVEGAÇÃO CORRIGIDA: Verificar se é modo de edição
      const isEditing = route.params.eventTitle?.includes('Editar');
      
      if (isEditing) {
        // Se é edição, voltar para EvenLoveMain
        navigation.replace('EvenLoveMain', { eventId });
      } else {
        // Se é criação, voltar para Main (CommunityScreen)
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    }
  };

  const handleCreateProfile = async () => {
    try {
      // Mapear dados do frontend para o formato aceito pelo backend (CreateProfileDto)
      const profileData = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        photos: formData.photos,
        lookingFor: 'ANY' as const, // Valor padrão válido
        showMe: 'EVERYONE' as const, // Valor padrão válido
        ageRangeMin: formData.preferences.minAge,
        ageRangeMax: formData.preferences.maxAge,
        maxDistance: formData.preferences.maxDistance,
      };

      console.log('🚀 Enviando dados para o backend:', JSON.stringify(profileData, null, 2));

      // 🔧 Verificar se é edição ou criação
      const isEditing = route.params.eventTitle?.includes('Editar');
      
      if (isEditing && profile) {
        // Usar updateProfile se estamos editando
        await updateProfile(eventId, profileData);
        console.log('✅ Perfil atualizado com sucesso');
      } else {
        // Usar createProfile se estamos criando
        await createProfile(eventId, profileData);
        console.log('✅ Perfil criado com sucesso');
      }
      
      // 🗑️ Limpar dados salvos após operação bem-sucedida
      await clearSavedData();
      
      // 🎯 Animação suave ao finalizar
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        Alert.alert(
          isEditing ? '✅ Perfil atualizado!' : '🎉 Perfil criado!',
          isEditing 
            ? 'Suas alterações foram salvas com sucesso!' 
            : 'Seu perfil foi criado com sucesso. Agora você pode começar a conhecer pessoas!',
          [
            {
              text: isEditing ? 'Voltar' : 'Começar',
              onPress: () => {
                // 🔧 NAVEGAÇÃO CORRIGIDA: Usar replace para evitar pilha de navegação
                navigation.replace('EvenLoveMain', { eventId });
              },
            },
          ]
        );
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar perfil:', error);
      
      // Melhor tratamento de erro
      let errorMessage = 'Não foi possível salvar o perfil. Tente novamente.';
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join('\n');
        } else {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('Erro', errorMessage);
    }
  };

  if (isCheckingEligibility) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#151515', '#1f1f1f', '#252525']} style={styles.background}>
          <View style={styles.loadingContainer}>
            <LinearGradient colors={[colors.brand.primary, '#FFD700']} style={styles.loadingIcon}>
              <Ionicons name="heart" size={32} color="#000000" />
            </LinearGradient>
            <Text style={styles.loadingTitle}>Verificando elegibilidade...</Text>
            <Text style={styles.loadingSubtitle}>Aguarde um momento</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (isEligible === false) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#151515', '#1f1f1f', '#252525']} style={styles.background}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Ionicons name="close-circle" size={64} color="#ef4444" />
            </View>
            <Text style={styles.errorTitle}>Acesso não autorizado</Text>
            <Text style={styles.errorMessage}>{eligibilityReason}</Text>
            <TouchableOpacity 
              style={styles.errorButton} 
              onPress={() => {
                // 🔧 NAVEGAÇÃO CORRIGIDA: Voltar para Main
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              }}
            >
              <Text style={styles.errorButtonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // 🔧 CORREÇÃO: Só retornar null se NÃO for modo de edição
  const isEditMode = route.params.eventTitle?.includes('Editar');
  if (profile && !isEditMode) {
    return null; // Navegação será feita no useEffect (somente quando não editando)
  }

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return renderGenderSelection();
      case 1:
        return renderInterestedGendersSelection();
      case 2:
        return renderBasicInfo();
      case 3:
        return renderPhotoUpload();
      case 4:
        return renderInterests();
      case 5:
        return renderPreferences();
      default:
        return null;
    }
  };

  const renderGenderSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Qual é o seu gênero?</Text>
      <Text style={styles.stepSubtitle}>Esta informação nos ajuda a mostrar perfis mais relevantes</Text>
      
      <View style={styles.optionsContainer}>
        {GENDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              formData.gender === option.value && styles.optionCardSelected
            ]}
            onPress={() => handleGenderSelection(option.value)}
          >
            <Ionicons 
              name={option.icon as any} 
              size={24} 
              color={formData.gender === option.value ? '#000000' : colors.brand.primary} 
            />
            <Text style={[
              styles.optionText,
              formData.gender === option.value && styles.optionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInterestedGendersSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quem você gostaria de conhecer?</Text>
      <Text style={styles.stepSubtitle}>Selecione uma ou mais opções</Text>
      
      <View style={styles.optionsContainer}>
        {GENDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              formData.interestedInGenders.includes(option.value) && styles.optionCardSelected
            ]}
            onPress={() => handleInterestedGenderToggle(option.value)}
          >
            <Ionicons 
              name={option.icon as any} 
              size={24} 
              color={formData.interestedInGenders.includes(option.value) ? '#000000' : colors.brand.primary} 
            />
            <Text style={[
              styles.optionText,
              formData.interestedInGenders.includes(option.value) && styles.optionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informações básicas</Text>
      <Text style={styles.stepSubtitle}>Como você gostaria de aparecer no EvenLove?</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nome de exibição *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.displayName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
          placeholder="Como você quer ser chamado?"
          placeholderTextColor="#666666"
          maxLength={50}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Idade *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.age}
          onChangeText={(text) => setFormData(prev => ({ ...prev, age: text.replace(/[^0-9]/g, '') }))}
          placeholder="Sua idade"
          placeholderTextColor="#666666"
          keyboardType="numeric"
          maxLength={2}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Bio (opcional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.bio}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
          placeholder="Conte um pouco sobre você..."
          placeholderTextColor="#666666"
          multiline
          numberOfLines={4}
          maxLength={300}
        />
        <Text style={styles.characterCount}>{formData.bio.length}/300</Text>
      </View>
    </View>
  );

  const renderPhotoUpload = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Adicione suas fotos</Text>
      <Text style={styles.stepSubtitle}>Adicione pelo menos uma foto para continuar</Text>
      
      <View style={styles.photosContainer}>
        {formData.photos.map((photo, index) => (
          <View key={index} style={styles.photoCard}>
            {/* 🖼️ MINIATURA REAL DA IMAGEM */}
            <Image 
              source={{ uri: photo }} 
              style={styles.photoPreview}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.removePhotoButton}
              onPress={() => {
                const newPhotos = formData.photos.filter((_, i) => i !== index);
                setFormData(prev => ({ ...prev, photos: newPhotos }));
                updateField('photos', newPhotos); // 💾 Salvar automaticamente
              }}
            >
              <Ionicons name="close" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ))}
        
        {formData.photos.length < 6 && (
          <TouchableOpacity style={styles.addPhotoCard} onPress={handlePhotoUpload}>
            <Ionicons name="add" size={32} color={colors.brand.primary} />
            <Text style={styles.addPhotoText}>Adicionar foto</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderInterests = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Seus interesses</Text>
      <Text style={styles.stepSubtitle}>Selecione o que você curte (opcional)</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.interestsGrid}>
          {INTEREST_OPTIONS.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.interestTag,
                formData.interests.includes(interest) && styles.interestTagSelected
              ]}
              onPress={() => handleInterestToggle(interest)}
            >
              <Text style={[
                styles.interestTagText,
                formData.interests.includes(interest) && styles.interestTagTextSelected
              ]}>
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderPreferences = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Suas preferências</Text>
      <Text style={styles.stepSubtitle}>Personalize sua experiência</Text>
      
      <View style={styles.preferenceContainer}>
        <Text style={styles.preferenceLabel}>Faixa etária</Text>
        <View style={styles.ageRangeContainer}>
          <View style={styles.ageInputContainer}>
            <Text style={styles.ageLabel}>Mín.</Text>
            <TextInput
              style={styles.ageInput}
              value={formData.preferences.minAge.toString()}
              onChangeText={(text) => {
                const age = parseInt(text) || 18;
                setFormData(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, minAge: Math.max(18, age) }
                }));
              }}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <Text style={styles.ageRangeSeparator}>-</Text>
          <View style={styles.ageInputContainer}>
            <Text style={styles.ageLabel}>Máx.</Text>
            <TextInput
              style={styles.ageInput}
              value={formData.preferences.maxAge.toString()}
              onChangeText={(text) => {
                const age = parseInt(text) || 50;
                setFormData(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, maxAge: Math.min(99, age) }
                }));
              }}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>
      </View>

      <View style={styles.preferenceContainer}>
        <Text style={styles.preferenceLabel}>Distância máxima: {formData.preferences.maxDistance}km</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient colors={['#151515', '#1f1f1f', '#252525']} style={styles.background}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.brand.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <LinearGradient colors={[colors.brand.primary, '#FFD700']} style={styles.headerIcon}>
              <Ionicons name="heart" size={20} color="#000000" />
            </LinearGradient>
            <Text style={styles.headerTitle}>
              {route.params.eventTitle?.includes('Editar') ? 'Editar Perfil' : 'EvenLove'}
            </Text>
          </View>
          
          <View style={styles.headerButton} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[
                styles.progressFill,
                { width: `${((step + 1) / 6) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{step + 1} de 6</Text>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {renderStepContent()}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.nextButton,
              !validateStep(step) && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!validateStep(step) || isProfileLoading}
          >
            <LinearGradient
              colors={validateStep(step) ? [colors.brand.primary, '#FFD700'] : ['#333333', '#333333']}
              style={styles.nextButtonGradient}
            >
              <Text style={[
                styles.nextButtonText,
                !validateStep(step) && styles.nextButtonTextDisabled
              ]}>
                {step === 5 
                  ? (route.params.eventTitle?.includes('Editar') ? 'Salvar Alterações' : 'Finalizar')
                  : 'Continuar'
                }
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  loadingSubtitle: {
    fontSize: typography.fontSizes.md,
    color: '#cccccc',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorIcon: {
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.fontSizes.md,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  errorButton: {
    backgroundColor: '#333333',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  errorButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: 'white',
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
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.fontSizes.sm,
    color: '#cccccc',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  stepContainer: {
    flex: 1,
    paddingVertical: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.fontSizes.md,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  optionText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: 'white',
    marginLeft: spacing.md,
  },
  optionTextSelected: {
    color: '#000000',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: 'white',
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: '#252525',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.fontSizes.md,
    color: 'white',
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: typography.fontSizes.sm,
    color: '#666666',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoCard: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    aspectRatio: 0.8,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: borderRadius.lg,
  },
  removePhotoButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoCard: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    aspectRatio: 0.8,
    backgroundColor: '#252525',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestTag: {
    backgroundColor: '#252525',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#333333',
  },
  interestTagSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  interestTagText: {
    fontSize: typography.fontSizes.sm,
    color: 'white',
    fontWeight: typography.fontWeights.medium,
  },
  interestTagTextSelected: {
    color: '#000000',
  },
  preferenceContainer: {
    marginBottom: spacing.lg,
  },
  preferenceLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: 'white',
    marginBottom: spacing.md,
  },
  ageRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  ageInputContainer: {
    alignItems: 'center',
  },
  ageLabel: {
    fontSize: typography.fontSizes.sm,
    color: '#cccccc',
    marginBottom: spacing.xs,
  },
  ageInput: {
    backgroundColor: '#252525',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.fontSizes.lg,
    color: 'white',
    textAlign: 'center',
    width: 80,
    borderWidth: 1,
    borderColor: '#333333',
  },
  ageRangeSeparator: {
    fontSize: typography.fontSizes.xl,
    color: '#cccccc',
    fontWeight: typography.fontWeights.bold,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  nextButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: '#000000',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonTextDisabled: {
    color: '#666666',
  },
});

export default EvenLoveEntryScreen; 