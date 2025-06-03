import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

interface EventFormData {
  title: string;
  description: string;
  date: Date;
  endDate: Date;
  location: string;
  type: string;
  category: string;
  mediaUrls: string[];
  tags: string[];
  maxAttendees: number;
  minAge: number;
  isPrivate: boolean;
  requiresApproval: boolean;
  allowCancellation: boolean;
  cancellationPolicy: string;
  venue: {
    name: string;
    address: string;
    capacity: number;
    facilities: string[];
  };
  organizer: {
    name: string;
    email: string;
    phone: string;
    website: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
}

interface TicketBatch {
  id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  maxPerUser: number;
  startSaleDate: Date;
  endSaleDate: Date;
  isVisible: boolean;
  includesFees: boolean;
  transferable: boolean;
  refundable: boolean;
}

const EVENT_TYPES = [
  { value: 'SHOW', label: 'Show Musical', icon: 'musical-notes', color: '#9333EA' },
  { value: 'SPORTS', label: 'Esportivo', icon: 'trophy', color: '#EA580C' },
  { value: 'THEATER', label: 'Teatro', icon: 'library', color: '#DC2626' },
  { value: 'CONFERENCE', label: 'Conferência', icon: 'people', color: '#059669' },
  { value: 'WORKSHOP', label: 'Workshop', icon: 'school', color: '#0284C7' },
  { value: 'PARTY', label: 'Festa', icon: 'wine', color: '#7C2D12' },
  { value: 'EXHIBITION', label: 'Exposição', icon: 'image', color: '#4338CA' },
  { value: 'FOOD', label: 'Gastronômico', icon: 'restaurant', color: '#B91C1C' },
];

const EVENT_CATEGORIES = [
  'Música', 'Esportes', 'Teatro', 'Tecnologia', 'Negócios', 'Arte', 
  'Culinária', 'Educação', 'Saúde', 'Moda', 'Fotografia', 'Literatura'
];

const FACILITIES = [
  'Estacionamento', 'Wi-Fi', 'Ar Condicionado', 'Acessibilidade', 
  'Bar/Restaurante', 'Banheiros', 'Segurança', 'Som Profissional'
];

const CreateEventScreenPro: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'date' | 'time'>('date');
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: new Date(),
    endDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours later
    location: '',
    type: 'SHOW',
    category: '',
    mediaUrls: [],
    tags: [],
    maxAttendees: 100,
    minAge: 0,
    isPrivate: false,
    requiresApproval: false,
    allowCancellation: true,
    cancellationPolicy: '',
    venue: {
      name: '',
      address: '',
      capacity: 100,
      facilities: [],
    },
    organizer: {
      name: '',
      email: '',
      phone: '',
      website: '',
    },
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
  });

  const [ticketBatches, setTicketBatches] = useState<TicketBatch[]>([]);
  const [currentBatch, setCurrentBatch] = useState<TicketBatch>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    maxPerUser: 4,
    startSaleDate: new Date(),
    endSaleDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    isVisible: true,
    includesFees: false,
    transferable: true,
    refundable: false,
  });

  const navigation = useNavigation();
  const { user } = useAuth();

  const totalSteps = 5; // Increased for more comprehensive form

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        organizer: {
          name: user.name || '',
          email: user.email || '',
          phone: '',
          website: '',
        },
      }));
    }
  }, [user]);

  const updateFormData = useCallback((field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateNestedFormData = useCallback((parent: keyof EventFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        return !!(formData.title && formData.description && formData.location);
      case 1: // Date & Time
        return formData.date < formData.endDate;
      case 2: // Media & Details
        return !!(formData.type && formData.mediaUrls.length > 0);
      case 3: // Venue & Organizer
        return !!(formData.venue.name && formData.organizer.name);
      case 4: // Tickets
        return ticketBatches.length > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar imagens.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, ...newImages].slice(0, 5), // Max 5 images
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index),
    }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const toggleFacility = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      venue: {
        ...prev.venue,
        facilities: prev.venue.facilities.includes(facility)
          ? prev.venue.facilities.filter(f => f !== facility)
          : [...prev.venue.facilities, facility],
      },
    }));
  };

  const addTicketBatch = () => {
    if (!currentBatch.name.trim() || currentBatch.price < 0 || currentBatch.quantity <= 0) {
      Alert.alert('Dados inválidos', 'Verifique os dados do lote de ingressos.');
      return;
    }

    const newBatch: TicketBatch = {
      ...currentBatch,
      id: Date.now().toString(),
    };

    setTicketBatches(prev => [...prev, newBatch]);
    setCurrentBatch({
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      maxPerUser: 4,
      startSaleDate: new Date(),
      endSaleDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isVisible: true,
      includesFees: false,
      transferable: true,
      refundable: false,
    });
  };

  const removeTicketBatch = (id: string) => {
    setTicketBatches(prev => prev.filter(batch => batch.id !== id));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      Alert.alert('Erro', 'Verifique todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {
      // Here you would implement the actual API call
      console.log('Creating event:', { formData, ticketBatches });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Sucesso!', 
        'Evento criado com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o evento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <View style={[
            styles.stepDot,
            i <= currentStep && styles.stepDotActive,
            i === currentStep && styles.stepDotCurrent,
          ]}>
            {i < currentStep ? (
              <Ionicons name="checkmark" size={16} color={colors.brand.background} />
            ) : (
              <Text style={[styles.stepNumber, i === currentStep && styles.stepNumberActive]}>
                {i + 1}
              </Text>
            )}
          </View>
          {i < totalSteps - 1 && (
            <View style={[styles.stepLine, i < currentStep && styles.stepLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Informações Básicas</Text>
      <Text style={styles.stepDescription}>Vamos começar com os dados principais do seu evento</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Título do Evento *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.title}
          onChangeText={(value) => updateFormData('title', value)}
          placeholder="Ex: Festival de Música Eletrônica 2024"
          placeholderTextColor={colors.brand.textSecondary}
          maxLength={100}
        />
        <Text style={styles.characterCount}>{formData.title.length}/100</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Descrição *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.description}
          onChangeText={(value) => updateFormData('description', value)}
          placeholder="Descreva seu evento, atrações, programação..."
          placeholderTextColor={colors.brand.textSecondary}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
        <Text style={styles.characterCount}>{formData.description.length}/1000</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Local *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.location}
          onChangeText={(value) => updateFormData('location', value)}
          placeholder="Ex: Arena Music Hall, São Paulo"
          placeholderTextColor={colors.brand.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {EVENT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                formData.category === category && styles.categoryChipActive,
              ]}
              onPress={() => updateFormData('category', category)}
            >
              <Text style={[
                styles.categoryChipText,
                formData.category === category && styles.categoryChipTextActive,
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderDateTime = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Data e Horário</Text>
      <Text style={styles.stepDescription}>Defina quando seu evento acontecerá</Text>

      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeItem}>
          <Text style={styles.inputLabel}>Data de Início *</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => {
              setDatePickerType('date');
              setShowDatePicker(true);
            }}
          >
            <Ionicons name="calendar" size={20} color={colors.brand.primary} />
            <Text style={styles.dateTimeText}>
              {formData.date.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateTimeItem}>
          <Text style={styles.inputLabel}>Horário</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => {
              setDatePickerType('time');
              setShowDatePicker(true);
            }}
          >
            <Ionicons name="time" size={20} color={colors.brand.primary} />
            <Text style={styles.dateTimeText}>
              {formData.date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeItem}>
          <Text style={styles.inputLabel}>Data de Término</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={colors.brand.primary} />
            <Text style={styles.dateTimeText}>
              {formData.endDate.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateTimeItem}>
          <Text style={styles.inputLabel}>Duração</Text>
          <View style={styles.durationDisplay}>
            <Ionicons name="hourglass" size={20} color={colors.brand.secondary} />
            <Text style={styles.durationText}>
              {Math.round((formData.endDate.getTime() - formData.date.getTime()) / (1000 * 60 * 60))}h
            </Text>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode={datePickerType}
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              updateFormData('date', selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.endDate}
          mode="datetime"
          display="default"
          minimumDate={formData.date}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              updateFormData('endDate', selectedDate);
            }
          }}
        />
      )}
    </View>
  );

  const renderMediaAndDetails = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Mídia e Detalhes</Text>
      <Text style={styles.stepDescription}>Adicione imagens e configure os detalhes do evento</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tipo de Evento *</Text>
        <View style={styles.eventTypesGrid}>
          {EVENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.eventTypeCard,
                formData.type === type.value && styles.eventTypeCardActive,
              ]}
              onPress={() => updateFormData('type', type.value)}
            >
              <LinearGradient
                colors={formData.type === type.value 
                  ? [type.color, `${type.color}CC`] 
                  : ['transparent', 'transparent']
                }
                style={styles.eventTypeGradient}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={24} 
                  color={formData.type === type.value ? 'white' : type.color} 
                />
                <Text style={[
                  styles.eventTypeLabel,
                  formData.type === type.value && styles.eventTypeLabelActive,
                ]}>
                  {type.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Imagens do Evento * (máx. 5)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
          <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
            <Ionicons name="camera" size={32} color={colors.brand.primary} />
            <Text style={styles.addImageText}>Adicionar</Text>
          </TouchableOpacity>
          
          {formData.mediaUrls.map((uri, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image source={{ uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
              {index === 0 && (
                <View style={styles.mainImageBadge}>
                  <Text style={styles.mainImageText}>CAPA</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.settingsGrid}>
        <View style={styles.settingItem}>
          <Text style={styles.inputLabel}>Idade mínima</Text>
          <TextInput
            style={styles.numberInput}
            value={formData.minAge.toString()}
            onChangeText={(value) => updateFormData('minAge', parseInt(value) || 0)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.brand.textSecondary}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.inputLabel}>Máx. participantes</Text>
          <TextInput
            style={styles.numberInput}
            value={formData.maxAttendees.toString()}
            onChangeText={(value) => updateFormData('maxAttendees', parseInt(value) || 100)}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor={colors.brand.textSecondary}
          />
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderDateTime();
      case 2:
        return renderMediaAndDetails();
      case 3:
        return <Text style={styles.stepTitle}>Venue & Organizer (Em breve)</Text>;
      case 4:
        return <Text style={styles.stepTitle}>Tickets (Em breve)</Text>;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Criar Evento</Text>
          <TouchableOpacity style={styles.saveButton}>
            <Ionicons name="bookmark" size={24} color={colors.brand.primary} />
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton, currentStep === 0 && styles.navButtonDisabled]}
            onPress={prevStep}
            disabled={currentStep === 0}
          >
            <Ionicons name="chevron-back" size={20} color={colors.brand.textSecondary} />
            <Text style={styles.navButtonText}>Anterior</Text>
          </TouchableOpacity>

          <Text style={styles.stepCounter}>
            {currentStep + 1} de {totalSteps}
          </Text>

          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={currentStep === totalSteps - 1 ? handleSubmit : nextStep}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.brand.background} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === totalSteps - 1 ? 'Criar Evento' : 'Próximo'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.brand.background} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.opacity.cardBorder,
  },
  stepDotActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  stepDotCurrent: {
    transform: [{ scale: 1.1 }],
    elevation: 4,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stepNumber: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textSecondary,
  },
  stepNumberActive: {
    color: colors.brand.background,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.opacity.cardBorder,
    marginHorizontal: spacing.sm,
  },
  stepLineActive: {
    backgroundColor: colors.brand.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  stepContent: {
    paddingVertical: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSizes.md * 1.5,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: colors.brand.darkGray,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  categoryChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  categoryChipText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  categoryChipTextActive: {
    color: colors.brand.background,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  dateTimeItem: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  dateTimeText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  durationText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.bold,
  },
  eventTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  eventTypeCard: {
    width: (screenWidth - spacing.xl * 2 - spacing.md) / 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  eventTypeCardActive: {
    borderColor: colors.brand.primary,
    elevation: 4,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  eventTypeGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    minHeight: 80,
    justifyContent: 'center',
  },
  eventTypeLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  eventTypeLabelActive: {
    color: 'white',
  },
  imagesScroll: {
    flexDirection: 'row',
  },
  addImageButton: {
    width: 120,
    height: 120,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
    marginTop: spacing.sm,
  },
  imagePreview: {
    position: 'relative',
    marginRight: spacing.md,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImageBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  mainImageText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.background,
    fontWeight: typography.fontWeights.bold,
  },
  settingsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  settingItem: {
    flex: 1,
  },
  numberInput: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.opacity.cardBorder,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  prevButton: {
    backgroundColor: colors.brand.darkGray,
  },
  nextButton: {
    backgroundColor: colors.brand.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  nextButtonText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.background,
    fontWeight: typography.fontWeights.semibold,
  },
  stepCounter: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
});

export default CreateEventScreenPro; 