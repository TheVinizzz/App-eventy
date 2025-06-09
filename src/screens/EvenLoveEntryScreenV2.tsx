import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useEvenLove } from '../contexts/EvenLoveContextV2';
// import PhotoUploadGrid from '../components/PhotoUploadGrid';

const { width } = Dimensions.get('window');

type EvenLoveEntryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EvenLoveEntry'>;
type EvenLoveEntryScreenRouteProp = RouteProp<RootStackParamList, 'EvenLoveEntry'>;

interface Props {
  navigation: EvenLoveEntryScreenNavigationProp;
  route: EvenLoveEntryScreenRouteProp;
}

// 🎯 INTERFACE DE FORMULÁRIO
interface ProfileFormData {
  displayName: string;
  bio: string;
  age: string;
  interests: string[];
  photos: string[];
}

const INTERESTS_OPTIONS = [
  'Música', 'Dança', 'Arte', 'Cinema', 'Livros', 'Viagem', 'Esportes', 
  'Gastronomia', 'Tecnologia', 'Natureza', 'Fotografia', 'Games',
  'Moda', 'Fitness', 'Praia', 'Montanha', 'Festa', 'Teatro'
];

// 🚀 COMPONENTE PRINCIPAL DE ALTA PERFORMANCE
const EvenLoveEntryScreenV2: React.FC<Props> = ({ navigation, route }) => {
  const { eventId, eventTitle } = route.params;
  const isEditMode = eventTitle?.includes('Editar') || false;
  
  // 🎯 CONTEXTO AVANÇADO
  const { 
    state,
    createProfile,
    updateProfile,
    initializeEvent,
  } = useEvenLove();

  // 🎨 ESTADO DO FORMULÁRIO
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    bio: '',
    age: '',
    interests: [],
    photos: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 🎭 ANIMAÇÕES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // 🔄 INICIALIZAÇÃO CONTROLADA
  useEffect(() => {
    if (!isInitialized) {
      const initializeScreen = async () => {
        try {
          console.log('🚀 EvenLove Entry V2: Inicializando');
          
          // Se é modo de edição, carregar dados existentes
          if (isEditMode) {
            await initializeEvent(eventId);
            
            // Preencher formulário com dados existentes
            if (state.profile) {
              setFormData({
                displayName: state.profile.displayName || '',
                bio: state.profile.bio || '',
                age: state.profile.age?.toString() || '',
                interests: state.profile.interests || [],
                photos: state.profile.photos || [],
              });
            }
          }
          
          setIsInitialized(true);
          
          // Animação de entrada
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
          
        } catch (error) {
          console.error('❌ EvenLove Entry V2: Erro na inicialização:', error);
          setIsInitialized(true); // Continuar mesmo com erro
        }
      };

      initializeScreen();
    }
  }, [isInitialized, isEditMode, eventId, initializeEvent, state.profile, fadeAnim, slideAnim]);

  // 📝 HANDLERS DO FORMULÁRIO
  const updateFormField = useCallback((field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  }, []);

  // 📸 UPLOAD DE FOTOS
  const handleAddPhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, photoUri]
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto');
    }
  }, []);

  const handleRemovePhoto = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  }, []);

  // ✅ VALIDAÇÃO E SUBMISSÃO
  const validateForm = useCallback((): boolean => {
    if (!formData.displayName.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe seu nome');
      return false;
    }
    
    if (!formData.age.trim() || isNaN(Number(formData.age))) {
      Alert.alert('Campo obrigatório', 'Por favor, informe uma idade válida');
      return false;
    }
    
    const age = Number(formData.age);
    if (age < 18 || age > 100) {
      Alert.alert('Idade inválida', 'A idade deve estar entre 18 e 100 anos');
      return false;
    }
    
    if (formData.interests.length === 0) {
      Alert.alert('Selecione interesses', 'Por favor, selecione pelo menos um interesse');
      return false;
    }
    
    if (formData.photos.length === 0) {
      Alert.alert('Adicione uma foto', 'Por favor, adicione pelo menos uma foto');
      return false;
    }
    
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const profileData = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        age: Number(formData.age),
        interests: formData.interests,
        photos: formData.photos,
        // Campos obrigatórios para a API
        lookingFor: 'ANY' as const,
        showMe: 'EVERYONE' as const,
        // Campos opcionais com valores padrão
        ageRangeMin: 18,
        ageRangeMax: 65,
        maxDistance: 50,
        musicPreferences: [],
      };

      console.log('🚀 EvenLove: Enviando dados do perfil:', JSON.stringify(profileData, null, 2));

      if (isEditMode) {
        await updateProfile(eventId, profileData);
                 Alert.alert(
           '✅ Perfil atualizado!',
           'Seu perfil foi atualizado com sucesso',
           [
             {
               text: 'OK',
               onPress: () => {
                 navigation.replace('EvenLoveMain', { eventId });
               }
             }
           ]
         );
      } else {
        await createProfile(eventId, profileData);
                 Alert.alert(
           '🎉 Perfil criado!',
           'Agora você pode começar a encontrar pessoas incríveis!',
           [
             {
               text: 'Começar',
               onPress: () => {
                 navigation.replace('EvenLoveMain', { eventId });
               }
             }
           ]
         );
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar perfil:', error);
      console.error('❌ Error response:', error.response?.data);
      
      let errorMessage = 'Não foi possível salvar o perfil. Tente novamente.';
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (errorData?.errors) {
          errorMessage = `Dados inválidos: ${JSON.stringify(errorData.errors)}`;
        } else {
          errorMessage = 'Dados do perfil inválidos. Verifique os campos preenchidos.';
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Você precisa estar logado para criar um perfil.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para criar um perfil neste evento.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, isSubmitting, formData, isEditMode, updateProfile, eventId, createProfile, navigation]);

  // 🔙 NAVEGAÇÃO
     const handleBack = useCallback(() => {
     if (isEditMode) {
       navigation.replace('EvenLoveMain', { eventId });
     } else {
       navigation.reset({
         index: 0,
         routes: [{ name: 'Main' }],
       });
     }
   }, [isEditMode, navigation, eventId]);

  // 🎨 RENDERIZAÇÃO CONDICIONAL
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            {isEditMode ? 'Carregando perfil...' : 'Preparando formulário...'}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
          
          {/* 📱 HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Editar Perfil' : 'Criar Perfil'}
            </Text>
            
            <View style={styles.headerButton} />
          </View>

          {/* 📝 FORMULÁRIO */}
          <Animated.ScrollView
            style={[
              styles.scrollContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              
              {/* 👤 INFORMAÇÕES BÁSICAS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações Básicas</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nome *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.displayName}
                    onChangeText={(text) => updateFormField('displayName', text)}
                    placeholder="Como você gostaria de ser chamado?"
                    placeholderTextColor="#999"
                    maxLength={50}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Idade *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.age}
                    onChangeText={(text) => updateFormField('age', text)}
                    placeholder="Sua idade"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={formData.bio}
                    onChangeText={(text) => updateFormField('bio', text)}
                    placeholder="Conte um pouco sobre você..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                  />
                </View>
              </View>

              {/* 🎯 INTERESSES */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interesses *</Text>
                <Text style={styles.sectionSubtitle}>
                  Selecione os que mais combinam com você
                </Text>
                
                <View style={styles.interestsGrid}>
                  {INTERESTS_OPTIONS.map((interest) => (
                    <TouchableOpacity
                      key={interest}
                      style={[
                        styles.interestChip,
                        formData.interests.includes(interest) && styles.interestChipSelected
                      ]}
                      onPress={() => toggleInterest(interest)}
                    >
                      <Text
                        style={[
                          styles.interestChipText,
                          formData.interests.includes(interest) && styles.interestChipTextSelected
                        ]}
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 📸 FOTOS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fotos *</Text>
                <Text style={styles.sectionSubtitle}>
                  Adicione até 6 fotos suas
                </Text>
                
                                 <View style={styles.photosGrid}>
                   {formData.photos.map((photo, index) => (
                     <TouchableOpacity
                       key={index}
                       style={styles.photoContainer}
                       onPress={() => handleRemovePhoto(index)}
                     >
                       <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                       <TouchableOpacity style={styles.removePhotoButton}>
                         <Ionicons name="close" size={20} color="#fff" />
                       </TouchableOpacity>
                     </TouchableOpacity>
                   ))}
                   {formData.photos.length < 6 && (
                     <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                       <Ionicons name="add" size={30} color="#667eea" />
                       <Text style={styles.addPhotoText}>Adicionar Foto</Text>
                     </TouchableOpacity>
                   )}
                 </View>
              </View>

              {/* 🚀 BOTÃO DE SUBMISSÃO */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#667eea" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Atualizar Perfil' : 'Criar Perfil'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.bottomSpacing} />
            </View>
          </Animated.ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flex: {
    flex: 1,
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
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 5,
  },
  interestChipSelected: {
    backgroundColor: '#fff',
  },
  interestChipText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  interestChipTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
     bottomSpacing: {
     height: 50,
   },
   photosGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 10,
   },
   photoContainer: {
     width: (width - 60) / 3,
     height: (width - 60) / 3,
     borderRadius: 12,
     overflow: 'hidden',
     position: 'relative',
   },
   photoThumbnail: {
     width: '100%',
     height: '100%',
   },
   removePhotoButton: {
     position: 'absolute',
     top: 5,
     right: 5,
     backgroundColor: 'rgba(0,0,0,0.7)',
     borderRadius: 15,
     width: 30,
     height: 30,
     justifyContent: 'center',
     alignItems: 'center',
   },
   addPhotoButton: {
     width: (width - 60) / 3,
     height: (width - 60) / 3,
     backgroundColor: 'rgba(255,255,255,0.9)',
     borderRadius: 12,
     borderWidth: 2,
     borderColor: '#667eea',
     borderStyle: 'dashed',
     justifyContent: 'center',
     alignItems: 'center',
   },
   addPhotoText: {
     color: '#667eea',
     fontSize: 12,
     fontWeight: '600',
     marginTop: 5,
     textAlign: 'center',
   },
 });

export default EvenLoveEntryScreenV2; 